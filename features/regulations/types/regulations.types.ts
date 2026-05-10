import type React from 'react';

// Regulations module types
export interface RegComment {
    id: string;
    user: string;
    avatar: string;
    content: string;
    date: string;
}

export interface RegArticle {
    id: string;        // e.g. "1.1"
    code: string;      // e.g. "Điều 1"
    title: string;
    content: string | React.ReactNode;
    type?: 'text' | 'chart' | 'list';
    comments?: RegComment[];
    subItems?: string[];
}

export interface RegChapter {
    id: string;
    code: string;      // e.g. "Chương I"
    title: string;
    icon?: React.ElementType;
    articles: RegArticle[];
    type?: 'text' | 'chart' | 'list';
}

export interface RegulationDocument {
    id: string;
    code: string;
    title: string;
    description: string;
    date: string;
    effectiveDate?: string;
    status: 'active' | 'draft' | 'archived';
    chapters: RegChapter[];
}
