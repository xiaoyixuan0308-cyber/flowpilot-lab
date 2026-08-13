export interface ImportResult {
  success: boolean;
  importedSheets: string[];
  totalRows: number;
  errorRows: number;
  errors?: string[];
}
