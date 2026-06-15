export interface Tenant {
    id: string;
    name: string;
    nif: string;
    slug: string;
    plan: 'FREE' | 'PRO' | 'TEAM' | 'BUSINESS';
}