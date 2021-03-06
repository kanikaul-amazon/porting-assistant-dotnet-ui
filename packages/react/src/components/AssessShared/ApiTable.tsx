import { useCollection } from "@awsui/collection-hooks";
import { Box, Pagination, Table, TableProps, TextFilter } from "@awsui/components-react";
import StatusIndicator from "@awsui/components-react/status-indicator/internal";
import React, { useMemo, useState } from "react";
import { useHistory, useLocation } from "react-router";

import { usePortingAssistantSelector } from "../../createReduxStore";
import { HistoryState } from "../../models/locationState";
import { Compatibility } from "../../models/project";
import { selectApiTableData } from "../../store/selectors/tableSelectors";
import { filteringCountText } from "../../utils/FilteringCountText";
import { InfoLink } from "../InfoLink";
import { TableHeader } from "../TableHeader";

export interface ApiTableData {
  apiName: string;
  packageName: string;
  packageVersion: string;
  calls: number;
  sourceFiles: Set<string>;
  locations: Array<{
    sourcefilePath: string;
    location: number;
  }>;
  replacement: string;
  isCompatible: Compatibility;
  deprecated?: boolean;
}

const ApiTableInternal: React.FC = () => {
  const location = useLocation<HistoryState>();
  const tableItems = usePortingAssistantSelector(state => selectApiTableData(state, location.pathname));
  const history = useHistory();

  const isLoading = useMemo(() => tableItems == null, [tableItems]);
  const loadedItems = useMemo(() => tableItems || [], [tableItems]);

  const [filterText, setFilterText] = useState("");
  const [sortDetail, setSortDetail] = useState<TableProps.SortingState<ApiTableData>>({
    sortingColumn: { sortingField: "apiName" },
    isDescending: false
  });
  const filteredItems = useMemo(() => {
    const allItems = loadedItems;
    return filterText === ""
      ? allItems
      : allItems.filter(i => i.apiName.toLowerCase().includes(filterText.toLowerCase()));
  }, [filterText, loadedItems]);

  const curPage = useMemo(() => {
    return location.state?.activePage || 1;
  }, [location.state]);

  const curItems = useMemo(() => {
    const descending = sortDetail.isDescending ? -1 : 1;
    const sortedItems = filteredItems.sort((a, b) => {
      const column = columnDefinitions.find(c => c.sortingField === sortDetail.sortingColumn.sortingField);
      if (column?.sortingComparator != null) {
        return column.sortingComparator(a, b) * descending;
      }
      if (column?.sortingField != null) {
        if ((a as any)[column.sortingField] === (b as any)[column.sortingField]) {
          return 0;
        }
        return ((a as any)[column.sortingField] > (b as any)[column.sortingField] ? 1 : -1) * descending;
      }
      return 1 * descending;
    });
    return sortedItems.slice((curPage - 1) * PAGE_SIZE, (curPage - 1) * PAGE_SIZE + PAGE_SIZE);
  }, [curPage, filteredItems, sortDetail.sortingColumn, sortDetail.isDescending]);

  const { items, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(curItems, {
    filtering: {
      empty: empty,
      noMatch: noMatch
    },
    pagination: { pageSize: PAGE_SIZE },
    sorting: {}
  });

  return (
    <Table<ApiTableData>
      {...collectionProps}
      loadingText="Loading source files"
      columnDefinitions={columnDefinitions}
      sortingColumn={sortDetail?.sortingColumn}
      sortingDescending={sortDetail?.isDescending}
      onSortingChange={e => {
        setSortDetail(e.detail);
      }}
      loading={isLoading}
      items={items}
      filter={
        <TextFilter
          {...filterProps}
          filteringPlaceholder="Search by API name"
          countText={filteringCountText(filteredItemsCount!)}
          onChange={e => setFilterText(e.detail.filteringText)}
        />
      }
      pagination={
        <Pagination
          {...paginationProps}
          pagesCount={Math.ceil(filteredItems.length / PAGE_SIZE)}
          currentPageIndex={curPage}
          onChange={e => {
            history.push({
              pathname: location.pathname,
              state: {
                activePage: e.detail.currentPageIndex,
                activeTabId: location.state?.activeTabId
              }
            });
          }}
        />
      }
      header={
        <TableHeader
          title="APIs"
          totalItems={loadedItems}
          infoLink={
            <InfoLink
              heading="APIs"
              mainContent={
                <>
                  <Box variant="p">
                    The following list shows how many API calls are made to incompatible packages. Porting Assistant for
                    .NET analyzes the source code of your .NET framework application to identify every API call to
                    either Microsoft Framework libraries or NuGet packages. Using dotnet and .NET portability analyzer
                    tools, Porting Assistant for .NET determines which calls are incompatible to .NET Core and groups
                    them based on their source library/package. Porting Assistant for .NET provides an interactive list
                    of all incompatible API calls and also provides export of the list as a text-based csv file.
                  </Box>
                  <Box variant="h4">Columns</Box>
                  <Box variant="p">
                    <Box variant="strong">Name</Box> - Name of the API call.
                  </Box>
                  <Box variant="p">
                    <Box variant="strong">Package</Box> - Name of the NuGet package that includes the API.
                  </Box>
                  <Box variant="p">
                    <Box variant="strong">Source files</Box> - The number of source files that include the API call.
                  </Box>
                  <Box variant="p">
                    <Box variant="strong">Calls</Box> - The number of instances of the API call in the project.
                  </Box>
                  <Box variant="p">
                    <Box variant="strong">Status</Box> - Compatibility status of the API call.
                  </Box>
                  <Box variant="p">
                    <Box variant="strong">Suggested replacement</Box> - Suggested replacements for compatiblity.
                  </Box>
                </>
              }
              learnMoreLinks={[]}
            />
          }
        />
      }
      empty={empty}
    ></Table>
  );
};

const PAGE_SIZE = 10;

const columnDefinitions: TableProps.ColumnDefinition<ApiTableData>[] = [
  {
    id: "api-name",
    header: "Name",
    cell: item => item.apiName,
    sortingField: "apiName"
    // width: 400
  },
  {
    id: "package-name",
    header: "Package",
    cell: item => `${item.packageName} ${item.packageVersion}`,
    sortingField: "packageName"
  },
  {
    id: "source-files",
    header: "Source files",
    cell: item => item.sourceFiles.size,
    sortingField: "sourceFiles",
    sortingComparator: (a: ApiTableData, b: ApiTableData) => a.sourceFiles.size - b.sourceFiles.size
  },
  {
    id: "calls",
    header: "Calls  ",
    cell: item => item.calls,
    sortingField: "calls"
  },
  {
    id: "status",
    header: "Status",
    cell: item =>
      item.isCompatible === "COMPATIBLE" ? (
        <StatusIndicator type="success">Compatible</StatusIndicator>
      ) : item.isCompatible === "UNKNOWN" ? (
        <StatusIndicator type="info">Unknown</StatusIndicator>
      ) : item.deprecated ? (
        <StatusIndicator type="info">Deprecated</StatusIndicator>
      ) : (
        <StatusIndicator type="error">Incompatible</StatusIndicator>
      ),
    sortingField: "isCompatible"
    // minWidth: "150px"
  },
  {
    id: "suggested-replacement",
    header: "Suggested replacement",
    cell: item => item.replacement,
    sortingField: "replacement"
    // width: 600
  }
];

const empty = (
  <Box textAlign="center">
    <Box margin={{ bottom: "xxs" }} padding={{ top: "xs" }}>
      <b>No APIs</b>
    </Box>

    <Box variant="p" margin={{ bottom: "xs" }}>
      No APIs to display.
    </Box>
  </Box>
);

const noMatch = (
  <Box textAlign="center">
    <Box margin={{ bottom: "xxs" }} padding={{ top: "xs" }}>
      <b>No matches</b>
    </Box>

    <Box variant="p" margin={{ bottom: "xs" }}>
      We can’t find a match.
    </Box>
  </Box>
);

export const ApiTable = React.memo(ApiTableInternal);
