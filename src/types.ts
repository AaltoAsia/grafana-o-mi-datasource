import { DataQuery, DataSourceJsonData } from '@grafana/data';
import { MetricFindValue } from '@grafana/data';

export interface MyQuery extends DataQuery {
  queryPath: string;
  newest?: number;
  odfType: string; // e.g. Object or InfoItem
}

export const defaultQuery: Partial<MyQuery> = {
  queryPath: '',
  newest: 500,
  odfType: 'InfoItem',
  hide: false
};

/**
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {
  path?: string;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface MySecureJsonData {
  apiKey?: string;
}

export interface SimpleSuggestions {
  type: string;
  suggestions: SimpleSuggestion[];
}

export interface SimpleSuggestion extends MetricFindValue {
  text: string;
  type: string;
  value: string;
}
