export interface FormQuestion {
  id: string;
  title: string;
  helpText?: string;
  type: 'text' | 'paragraph' | 'radio' | 'dropdown' | 'checkbox' | 'scale' | 'date' | 'time';
  required: boolean;
  options: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
}

export interface FormInfo {
  url: string;
  responseUrl: string;
  title: string;
  description: string;
  questionCount: number;
  questions: FormQuestion[];
  pageHistory?: string;
  fbzx?: string;
  requiresSignIn?: boolean;
}

export type RuleMode =
  | 'random_option'
  | 'specific_option'
  | 'fixed'
  | 'counter'
  | 'faker_full_name'
  | 'faker_first_name'
  | 'faker_last_name'
  | 'faker_email'
  | 'faker_phone'
  | 'faker_company'
  | 'faker_job'
  | 'faker_city'
  | 'faker_country'
  | 'faker_sentence'
  | 'faker_paragraph'
  | 'faker_number'
  | 'faker_date'
  | 'faker_time'
  | 'scale_rating'
  | 'csv_column';

export interface FieldRule {
  mode: RuleMode;
  fixedValue?: string;
  selectedOption?: string;
  selectedOptions?: string[];
  maxCheckboxPicks?: number;
  counterStart?: number;
  counterPrefix?: string;
  counterSuffix?: string;
  numberMin?: number;
  numberMax?: number;
  scaleValue?: number;
  csvColumn?: string;
  skip?: boolean;
}

export interface LogEntry {
  index: number;
  total: number;
  success: boolean;
  status: number;
  durationMs: number;
  payload: Record<string, any>;
  message: string;
  timestamp: string;
}

export interface BatchStats {
  total: number;
  current: number;
  successful: number;
  failed: number;
  isRunning: boolean;
  avgDurationMs: number;
  jobId?: string;
}
