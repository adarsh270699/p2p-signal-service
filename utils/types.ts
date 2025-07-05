export interface Transaction {
    event: string;
    from: string;
    to: string;
    payload?: any;
}
