/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface PutLogDataRequest {
  requestMetadata?: {
    service?: string;
    created?: string;
    namespace?: string;
    description?: string;
    version?: string;
    token?: string;
    [k: string]: unknown;
  };
  log?: {
    timeStamp?: string;
    logName?: string;
    logData?: string;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}
