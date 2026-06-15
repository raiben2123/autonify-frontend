export interface FiscalSummaryResponse {
    year: number;
    quarter: number;
    startDate: string;
    endDate: string;
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    totalVatCollected: number;
    totalVatPaid: number;
    vatBalance: number;
    totalWithholdingTax: number;
    estimatedIrpf: number;
    irpfBalance: number;
}