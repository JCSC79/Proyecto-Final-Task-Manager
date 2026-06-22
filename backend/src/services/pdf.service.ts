import PDFDocument from 'pdfkit';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ITask } from '../models/task.model.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = join(__dirname, '../../../frontend/src/assets/Logo.png');

// Palette 
const C = {
    brand: '#1a73e8',
    surface: '#f8f9fc',
    border: '#dde1ea',
    text: '#1a1d23',
    muted: '#6b7280',
    white: '#ffffff',
    pending: '#f59e0b',
    inProgress: '#3b82f6',
    completed: '#10b981',
    urgent: '#ef4444',
    high: '#f97316',
    medium: '#3b82f6',
    low: '#6b7280',
} as const;

//  i18n 
type Lang = 'en' | 'es';

const i18n: Record<Lang, Record<string, string>> = {
    en: {
        reportTitle: 'Task Report',
        adminTitle: 'Admin Report — Global Metrics',
        generated: 'Generated',
        by: 'By',
        summary: 'Summary',
        total: 'Total',
        pending: 'Pending',
        inProgress: 'In Progress',
        completed: 'Completed',
        completionRate: 'Completion Rate',
        rateShort: 'Rate %',
        taskList: 'Task List',
        noTasks: 'No tasks found.',
        statusPending: 'Pending',
        statusProgress: 'In Progress',
        statusDone: 'Completed',
        prioLow: 'Low',
        prioMedium: 'Medium',
        prioHigh: 'High',
        prioUrgent: 'Urgent',
        userMetrics: 'User Metrics',
        user: 'User',
        adminSummary: 'Platform Overview',
        totalUsers: 'Users',
        avgCompletion: 'Avg. Completion Rate',
        created: 'Created',
    },
    es: {
        reportTitle: 'Informe de Tareas',
        adminTitle: 'Informe Admin — Métricas Globales',
        generated: 'Generado',
        by: 'Por',
        summary: 'Resumen',
        total: 'Total',
        pending: 'Pendientes',
        inProgress: 'En Progreso',
        completed: 'Completadas',
        completionRate: 'Tasa de Finalización',
        rateShort: 'Tasa %',
        taskList: 'Lista de Tareas',
        noTasks: 'No se encontraron tareas.',
        statusPending: 'Pendiente',
        statusProgress: 'En Progreso',
        statusDone: 'Completada',
        prioLow: 'Baja',
        prioMedium: 'Media',
        prioHigh: 'Alta',
        prioUrgent: 'Urgente',
        userMetrics: 'Métricas por Usuario',
        user: 'Usuario',
        adminSummary: 'Resumen de la Plataforma',
        totalUsers: 'Usuarios',
        avgCompletion: 'Tasa Media de Finalización',
        created: 'Creada',
    },
};

// Helpers 
const tx = (t: Record<string, string>, k: string): string => t[k] ?? k;
const locale = (lang: Lang) => lang === 'es' ? 'es-ES' : 'en-GB';

function statusColor(s: string): string {
    if (s === 'PENDING') {
        return C.pending;
    }
    if (s === 'IN_PROGRESS') {
        return C.inProgress;
    }
    if (s === 'COMPLETED') {
        return C.completed;
    }
    return C.muted;
}

function sLabel(s: string, t: Record<string, string>): string {
    if (s === 'PENDING') {
        return tx(t, 'statusPending');
    }
    if (s === 'IN_PROGRESS') {
        return tx(t, 'statusProgress');
    }
    if (s === 'COMPLETED') {
        return tx(t, 'statusDone');
    }
    return s;
}

function pLabel(p: string, t: Record<string, string>): string {
    const map: Record<string, string> = { 
        LOW: 'prioLow', 
        MEDIUM: 'prioMedium', 
        HIGH: 'prioHigh', 
        URGENT: 'prioUrgent' };
    return tx(t, map[p] ?? p);
}

function getRateColor(r: number): string {
    if (r >= 75) {
        return C.completed;
    }
    if (r >= 40) {
        return C.inProgress;
    }
    return C.pending;
}

/** Branded header band — now includes time + generatedBy */
function pageHeader(doc: PDFKit.PDFDocument, title: string, t: Record<string, string>, lang: Lang, by: string): void {
    doc.rect(0, 0, 595, 72).fillColor(C.brand).fill();

    try { 
        doc.image(LOGO_PATH, 28, 13, { height: 46, fit: [46, 46] }); 
    } catch { /* skip */ }

    doc.fontSize(17).font('Helvetica-Bold').fillColor(C.white).text(title, 88, 20, { lineBreak: false });

    const now = new Date();
    const dateStr = now.toLocaleDateString(locale(lang), { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString(locale(lang), { hour: '2-digit', minute: '2-digit', second: '2-digit'});
    doc.fontSize(8.5).font('Helvetica').fillColor(C.white + 'cc')
        .text(`${tx(t, 'generated')}: ${dateStr}, ${timeStr}`, 88, 42, { lineBreak: false });
    if (by) {
        doc.text(`  ·  ${tx(t, 'by')}: ${by}`, { lineBreak: false, continued: false });
    }
    doc.y = 92;
}

/** Section header with left accent bar */
function sectionHeader(doc: PDFKit.PDFDocument, title: string): void {
    const y = doc.y + 6;
    doc.rect(50, y, 495, 22).fillColor(C.surface).fill();
    doc.rect(50, y, 4, 22).fillColor(C.brand).fill();
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.text).text(title, 62, y + 5, { lineBreak: false });
    doc.y = y + 30;
}

/** Render 5-card KPI row */
function kpiRow(doc: PDFKit.PDFDocument, kpis: { label: string; value: string; color: string }[]): void {
    const w = 90; 
    const gap = 8; 
    const y = doc.y;
    kpis.forEach((k, i) => {
        const x = 50 + i * (w + gap);
        doc.rect(x, y, w, 46).fillColor(C.surface).fill();
        doc.rect(x, y, w, 3).fillColor(k.color).fill();
        doc.fontSize(18).font('Helvetica-Bold').fillColor(k.color)
            .text(k.value, x, y + 10, { width: w, align: 'center', lineBreak: false });
        doc.fontSize(7).font('Helvetica').fillColor(C.muted)
            .text(k.label, x, y + 32, { width: w, align: 'center', lineBreak: false });
    });
    doc.y = y + 56;
}

// Public API 

export function generateTasksPdf(tasks: ITask[], lang: Lang = 'en', generatedBy = ''): Promise<Buffer> {
    const t = i18n[lang];
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: true });
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        pageHeader(doc, tx(t, 'reportTitle'), t, lang, generatedBy);
        sectionHeader(doc, tx(t, 'summary'));

        const total = tasks.length;
        const pending = tasks.filter(t2 => t2.status === 'PENDING').length;
        const inProgress = tasks.filter(t2 => t2.status === 'IN_PROGRESS').length;
        const done = tasks.filter(t2 => t2.status === 'COMPLETED').length;
        const rate = total > 0 ? Math.round((done / total) * 100) : 0;

        kpiRow(doc, [
            { label: tx(t, 'total'), value: String(total), color: C.brand },
            { label: tx(t, 'pending'), value: String(pending), color: C.pending },
            { label: tx(t, 'inProgress'), value: String(inProgress), color: C.inProgress },
            { label: tx(t, 'completed'), value: String(done), color: C.completed },
            { label: tx(t, 'completionRate'), value: `${rate}%`, color: C.brand },
        ]);

        doc.moveDown(1);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(C.border).lineWidth(1).stroke();
        doc.moveDown(1);
        sectionHeader(doc, tx(t, 'taskList'));

        if (tasks.length === 0) {
            doc.fontSize(11).fillColor(C.muted).text(tx(t, 'noTasks'), { align: 'center' });
        }

        tasks.forEach((task) => {
            if (doc.y > 710) {
                doc.addPage(); doc.y = 50;
            }
            const ry = doc.y;
            const sc = statusColor(task.status);

            // Left accent bar (status color, purely decorative — no badge)
            doc.rect(50, ry, 3, task.description ? 28 : 16).fillColor(sc).fill();

            // Title
            doc.fontSize(10).font('Helvetica-Bold').fillColor(C.text)
                .text(task.title, 58, ry, { width: 305, lineBreak: false });

            // Status · Priority as plain muted text (no color backgrounds)
            const metaTxt = sLabel(task.status, t) + (task.priority ? ` · ${pLabel(task.priority, t)}` : '');
            doc.fontSize(8.5).font('Helvetica').fillColor(C.muted)
                .text(metaTxt, 370, ry, { width: 130, lineBreak: false });

            // Date — rendered BEFORE description so doc.y is never moved backward
            if (task.createdAt) {
                const ds = new Date(task.createdAt).toLocaleDateString(locale(lang), { day: '2-digit', month: 'short', year: 'numeric' });
                doc.fontSize(7.5).fillColor(C.muted)
                    .text(ds, 460, ry + 2, { width: 85, align: 'right', lineBreak: false });
            }

            // Description — always flows downward; set y explicitly to avoid overlaps
            doc.y = ry + 15;
            if (task.description) {
                doc.fontSize(8.5).font('Helvetica').fillColor(C.muted)
                    .text(task.description, 58, doc.y, { width: 480 });
            }

            // Separator — y is always after description (or ry+15 if none)
            doc.y = Math.max(doc.y, ry + 15) + 5;
            doc.moveTo(53, doc.y).lineTo(545, doc.y).strokeColor(C.border).lineWidth(0.5).stroke();
            doc.y += 6;
        });

        doc.end();
    });
}

// Admin report 

export interface AdminUserStat {
    name?: string;
    email: string;
    stats: { total: number; pending: number; inProgress: number; completed: number; completionRate: number };
}

export function generateAdminPdf(users: AdminUserStat[], lang: Lang = 'en', generatedBy = ''): Promise<Buffer> {
    const t = i18n[lang];
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: true });
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        pageHeader(doc, tx(t, 'adminTitle'), t, lang, generatedBy);
        sectionHeader(doc, tx(t, 'adminSummary'));

        const totalUsers = users.length;
        const allTasks = users.reduce((s, u) => s + u.stats.total, 0);
        const allPending = users.reduce((s, u) => s + u.stats.pending, 0);
        const allProgress = users.reduce((s, u) => s + u.stats.inProgress, 0);
        const allDone = users.reduce((s, u) => s + u.stats.completed, 0);
        const avgRate = totalUsers > 0 ? Math.round(users.reduce((s, u) => s + u.stats.completionRate, 0) / totalUsers) : 0;

        kpiRow(doc, [
            { label: tx(t, 'totalUsers'), value: String(totalUsers), color: C.brand },
            { label: tx(t, 'total'), value: String(allTasks), color: C.muted },
            { label: tx(t, 'pending'), value: String(allPending), color: C.pending },
            { label: tx(t, 'inProgress'), value: String(allProgress), color: C.inProgress },
            { label: tx(t, 'completed'), value: String(allDone), color: C.completed },
        ]);

        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').fillColor(C.text)
            .text(`${tx(t, 'avgCompletion')}: `, 50, doc.y, { continued: true })
            .font('Helvetica-Bold').fillColor(C.completed).text(`${avgRate}%`);

        doc.moveDown(1.2);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(C.border).lineWidth(2).stroke();
        doc.moveDown(1);
        sectionHeader(doc, tx(t, 'userMetrics'));

        // Table columns: name(50, w=145), then numeric cols centered in 55px slots 
        const col = { name: 58, total: 195, pend: 255, prog: 315, done: 375, rate: 435 };
        const numW = 55; // width of each numeric column
        const hY = doc.y;
        doc.rect(50, hY - 2, 495, 18).fillColor(C.brand).fill();
        doc.fontSize(8).font('Helvetica-Bold').fillColor(C.white);
        doc.text(tx(t, 'user'), col.name, hY + 3, { width: 140, align: 'center', lineBreak: false });
        doc.text(tx(t, 'total'), col.total, hY + 3, { width: numW, align: 'center', lineBreak: false });
        doc.text(tx(t, 'pending'), col.pend, hY + 3, { width: numW, align: 'center', lineBreak: false });
        doc.text(tx(t, 'inProgress'), col.prog, hY + 3, { width: numW, align: 'center', lineBreak: false });
        doc.text(tx(t, 'completed'), col.done, hY + 3, { width: numW, align: 'center', lineBreak: false });
        doc.text(tx(t, 'rateShort'), col.rate, hY + 3, { width: numW, align: 'center', lineBreak: false });
        doc.y = hY + 20;

        users.forEach((user, i) => {
            if (doc.y > 730) {
                doc.addPage(); doc.y = 50;
            }
            const ry = doc.y;
            
            if (i % 2 === 0) {
                doc.rect(50, ry - 1, 495, 16).fillColor(C.surface).fill();
            }
            const name = (user.name ?? user.email).slice(0, 28);
            const rc = getRateColor(user.stats.completionRate);
            doc.fontSize(8).font('Helvetica').fillColor(C.text);
            doc.text(name, col.name, ry + 2, { width: 140, align: 'left', lineBreak: false });
            doc.text(String(user.stats.total), col.total, ry + 2, { width: numW, align: 'center', lineBreak: false });
            doc.text(String(user.stats.pending), col.pend, ry + 2, { width: numW, align: 'center', lineBreak: false });
            doc.text(String(user.stats.inProgress), col.prog, ry + 2, { width: numW, align: 'center', lineBreak: false });
            doc.text(String(user.stats.completed), col.done, ry + 2, { width: numW, align: 'center', lineBreak: false });
            doc.font('Helvetica-Bold').fillColor(rc)
                .text(`${user.stats.completionRate}%`, col.rate, ry + 2, { width: numW, align: 'center', lineBreak: false });
            doc.y = ry + 16;
        });   

        doc.end();
    });
}
