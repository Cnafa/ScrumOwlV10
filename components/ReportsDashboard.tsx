// components/ReportsDashboard.tsx
import React, { useState, useMemo } from 'react';
import { WorkItem, Epic, Team, User, ReportType, AssigneeWorkloadData, EpicProgressReportData, Sprint } from '../types';
import * as analytics from '../services/analyticsService';
import { useLocale } from '../context/LocaleContext';
import { SPRINTS } from '../constants';
import { XMarkIcon } from './icons';

// --- Prop Interfaces ---
interface ReportsDashboardProps {
    workItems: WorkItem[];
    epics: Epic[];
    teams: Team[];
    users: User[];
    sprints: Sprint[];
}

// --- Chart Components ---
const SimpleLineChart: React.FC<{ data: { labels: string[], datasets: { label: string, data: number[], color: string }[] } }> = ({ data }) => {
    const { t } = useLocale();
    if (!data || !Array.isArray(data.datasets) || !data.labels || data.labels.length === 0 || !data.datasets.some(ds => ds && ds.data && ds.data.length > 0)) {
        return <div className="w-full h-80 bg-gray-50 p-4 rounded-lg flex items-center justify-center text-gray-500">{t('report_no_data')}</div>;
    }

    const validDatasets = data.datasets.filter(ds => ds && Array.isArray(ds.data));
    const allData = validDatasets.flatMap(ds => ds.data.filter(p => typeof p === 'number' && isFinite(p)));

    if (allData.length === 0) {
        return <div className="w-full h-80 bg-gray-50 p-4 rounded-lg flex items-center justify-center text-gray-500">{t('report_no_data')}</div>;
    }

    const maxValue = Math.max(0, ...allData);
    const yAxisLabels = Array.from({ length: 5 }, (_, i) => Math.round(maxValue * i / 4));
    const effectiveMaxValue = maxValue > 0 ? maxValue : 1;
    
    return (
        <div className="w-full h-80 bg-gray-50 p-4 rounded-lg flex gap-4">
            <div className="flex flex-col justify-between text-xs text-gray-500">
                {yAxisLabels.reverse().map((label, i) => <span key={i}>{label}</span>)}
            </div>
            <div className="flex-grow grid grid-cols-1 relative">
                 <svg className="w-full h-full" viewBox={`0 0 ${data.labels.length * 40} 100`} preserveAspectRatio="none">
                    {validDatasets.map(dataset => (
                        <polyline
                            key={dataset.label}
                            fill="none"
                            stroke={dataset.color}
                            strokeWidth="2"
                            points={dataset.data.map((p, i) => `${i * 40 + 20},${100 - ((isFinite(p) ? p : 0) / effectiveMaxValue * 100)}`).join(' ')}
                        />
                    ))}
                </svg>
                <div className="w-full flex justify-around absolute bottom-[-20px] text-xs text-gray-500">
                    {data.labels.map(label => <span key={label}>{label}</span>)}
                </div>
            </div>
        </div>
    );
};

const SimpleBarChart: React.FC<{ data: { labels: string[], datasets: { label: string, data: number[], color: string }[] }, average?: number }> = ({ data, average }) => {
    const { t } = useLocale();
    if (!data || !Array.isArray(data.datasets) || !data.labels || data.labels.length === 0 || !data.datasets.some(ds => ds && ds.data && ds.data.length > 0)) {
        return <div className="w-full h-80 bg-gray-50 p-4 rounded-lg flex items-center justify-center text-gray-500">{t('report_no_data')}</div>;
    }

    const validDatasets = data.datasets.filter(ds => ds && Array.isArray(ds.data));
    const allData = validDatasets.flatMap(ds => ds.data.filter(p => typeof p === 'number' && isFinite(p)));

    if (allData.length === 0 && (average === undefined || !isFinite(average))) {
        return <div className="w-full h-80 bg-gray-50 p-4 rounded-lg flex items-center justify-center text-gray-500">{t('report_no_data')}</div>;
    }

    const maxValue = Math.max(0, ...allData, (average && isFinite(average) ? average : 0));
    const effectiveMaxValue = maxValue > 0 ? maxValue : 1;
    return (
        <div className="w-full h-80 bg-gray-50 p-4 rounded-lg flex flex-col justify-end">
            <div className="flex-grow flex items-end justify-around gap-2">
                {data.labels.map((label, i) => (
                    <div key={label} className="flex-1 flex flex-col items-center">
                        <div className="w-full flex justify-center gap-1">
                            {validDatasets.map(dataset => (
                                <div
                                    key={dataset.label}
                                    className="w-1/2 rounded-t"
                                    style={{ height: `${(((isFinite(dataset.data[i]) ? dataset.data[i] : 0)) / effectiveMaxValue) * 100}%`, backgroundColor: dataset.color }}
                                    title={`${dataset.label}: ${dataset.data[i]}`}
                                />
                            ))}
                        </div>
                        <span className="text-xs text-gray-500 mt-1">{label}</span>
                    </div>
                ))}
            </div>
             {average != null && isFinite(average) && (
                <div className="relative border-t-2 border-dashed border-red-400 mt-2">
                    <span className="absolute -top-3 left-0 bg-gray-50 px-1 text-xs text-red-500">Avg: {average.toFixed(2)}</span>
                </div>
            )}
        </div>
    );
};


// --- Main Component ---
export const ReportsDashboard: React.FC<ReportsDashboardProps> = (props) => {
    const { t } = useLocale();
    const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
    const [sprintFilter, setSprintFilter] = useState<string>(props.sprints[props.sprints.length - 1]?.id || '');
    const [drilldown, setDrilldown] = useState<{ title: string; items: WorkItem[] } | null>(null);

    const reportData = useMemo(() => {
        return {
            [ReportType.BURNDOWN]: analytics.getBurndownData(sprintFilter, props.workItems),
            [ReportType.VELOCITY]: analytics.getVelocityData(props.workItems, props.sprints),
            [ReportType.EPIC_PROGRESS]: analytics.getEpicProgressData(props.epics),
            [ReportType.ASSIGNEE_WORKLOAD]: analytics.getAssigneeWorkloadData(props.workItems, props.users),
        };
    }, [props.workItems, props.epics, props.users, props.sprints, sprintFilter]);

    const renderDashboard = () => (
        <>
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[#3B3936]">{t('reports_title')}</h2>
                <p className="text-gray-600 mt-1">{t('reports_dashboard_description')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ReportCard type={ReportType.BURNDOWN} onClick={() => setSelectedReport(ReportType.BURNDOWN)} />
                <ReportCard type={ReportType.VELOCITY} onClick={() => setSelectedReport(ReportType.VELOCITY)} />
                <ReportCard type={ReportType.EPIC_PROGRESS} onClick={() => setSelectedReport(ReportType.EPIC_PROGRESS)} />
                <ReportCard type={ReportType.ASSIGNEE_WORKLOAD} onClick={() => setSelectedReport(ReportType.ASSIGNEE_WORKLOAD)} />
            </div>
        </>
    );

    const renderDetailView = () => {
        if (!selectedReport) return null;

        let content;
        switch (selectedReport) {
            case ReportType.BURNDOWN:
                const burndown = reportData[ReportType.BURNDOWN];
                content = (
                    <div>
                        <div className="mb-4">
                            <label className="text-sm">Sprint:</label>
                            <select value={sprintFilter} onChange={e => setSprintFilter(e.target.value)} className="ml-2 p-1 border rounded">
                                {props.sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <SimpleLineChart data={{
                            labels: burndown.labels,
                            datasets: [
                                { label: t('report_ideal_line'), data: burndown.ideal, color: '#f87171' },
                                { label: t('report_actual_line'), data: burndown.actual, color: '#486966' }
                            ]
                        }} />
                        <DataInspector headers={['Day', 'Ideal', 'Actual']} data={burndown.labels.map((l, i) => [l, burndown.ideal[i]?.toFixed(1), burndown.actual[i]?.toFixed(1)])}/>
                    </div>
                );
                break;
            case ReportType.VELOCITY:
                const velocity = reportData[ReportType.VELOCITY];
                content = (
                     <div>
                        <SimpleBarChart data={{ labels: velocity.labels, datasets: [{ label: t('report_completed_points'), data: velocity.data, color: '#486966' }] }} average={velocity.average} />
                        <DataInspector headers={['Sprint', t('report_completed_points')]} data={velocity.labels.map((l, i) => [l, velocity.data[i]])} onRowClick={(row) => {
                            const sprintName = row[0];
                            const sprint = props.sprints.find(s => s.name === sprintName);
                            if (sprint) {
                                setDrilldown({title: `Items Done in ${sprintName}`, items: props.workItems.filter(item => item.sprintId === sprint.id && item.status === 'Done')})
                            }
                        }}/>
                    </div>
                );
                break;
            case ReportType.EPIC_PROGRESS:
                const epicProgress = reportData[ReportType.EPIC_PROGRESS];
                content = <DataInspector
                    headers={[t('epic'), 'Progress', 'Est. (Done/Total)']}
                    data={epicProgress.map(d => [d.epic.name, `${d.progress.toFixed(1)}%`, `${d.doneEstimation}/${d.totalEstimation}`])}
                    onRowClick={(_, index) => setDrilldown({ title: `Items in ${epicProgress[index].epic.name}`, items: props.workItems.filter(item => item.epicId === epicProgress[index].epic.id) })}
                    renderProgress={1}
                 />;
                break;
            case ReportType.ASSIGNEE_WORKLOAD:
                 const workload = reportData[ReportType.ASSIGNEE_WORKLOAD];
                 content = <DataInspector
                    headers={[t('assignee'), 'Open', 'In Progress', 'In Review', t('report_wip_limit')]}
                    data={workload.map(d => [
                      <div className="flex items-center gap-2">
                          <img src={d.assignee.avatarUrl} alt={d.assignee.name} className="w-6 h-6 rounded-full" />
                          <span>{d.assignee.name}</span>
                      </div>,
                      d.open,
                      d.inProgress,
                      d.inReview,
                      d.wipBreached ? t('report_wip_breached') : 'OK'
                    ])}
                    onRowClick={(_, index) => setDrilldown({ title: `Workload for ${workload[index].assignee.name}`, items: props.workItems.filter(item => item.assignee?.id === workload[index].assignee.id && item.status !== 'Done') })}
                    highlightRow={(row, index) => workload[index].wipBreached}
                />;
                break;
            default: content = <p>Report not implemented.</p>;
        }
        
        return (
            <div>
                <button onClick={() => setSelectedReport(null)} className="text-sm text-[#486966] mb-4">&larr; {t('report_back_to_dashboard')}</button>
                <h3 className="text-xl font-bold text-[#3B3936] mb-4">{t(`report_${selectedReport.toLowerCase()}_title` as any)}</h3>
                {content}
            </div>
        );
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow min-h-full">
            {selectedReport ? renderDetailView() : renderDashboard()}
            {drilldown && <DrilldownModal data={drilldown} onClose={() => setDrilldown(null)} />}
        </div>
    );
};


// --- Sub-Components ---
const ReportCard: React.FC<{ type: ReportType, onClick: () => void }> = ({ type, onClick }) => {
    const { t } = useLocale();
    const titleKey = `report_${type.toLowerCase()}_title` as any;
    const descKey = `report_${type.toLowerCase()}_description` as any;
    return (
        <button onClick={onClick} className="p-6 border rounded-lg text-left hover:bg-gray-50 hover:shadow-md transition-all">
            <h3 className="font-semibold text-lg text-[#486966]">{t(titleKey)}</h3>
            <p className="text-sm text-gray-600 mt-1">{t(descKey)}</p>
        </button>
    );
};

const DataInspector: React.FC<{ headers: string[], data: (string|number|undefined|React.ReactNode)[][], onRowClick?: (row: (string|number|undefined|React.ReactNode)[], index: number) => void, renderProgress?: number, highlightRow?: (row: (string|number|undefined|React.ReactNode)[], index: number) => boolean }> = ({ headers, data, onRowClick, renderProgress, highlightRow }) => {
    const { t } = useLocale();
    return (
        <div className="mt-6">
            <h4 className="font-semibold mb-2">{t('report_data_inspector')}</h4>
            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>{headers.map(h => <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((row, i) => (
                            <tr key={i} onClick={() => onRowClick?.(row, i)} className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} ${highlightRow?.(row, i) ? 'bg-red-50' : ''}`}>
                                {row.map((cell, j) => (
                                    <td key={j} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                        {j === renderProgress ? (
                                             <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div className="bg-[#486966] h-2.5 rounded-full" style={{ width: cell?.toString() }}></div>
                                             </div>
                                        ) : (React.isValidElement(cell) ? cell : cell)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const DrilldownModal: React.FC<{ data: { title: string, items: WorkItem[] }, onClose: () => void }> = ({ data, onClose }) => {
    const { t } = useLocale();
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onMouseDown={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[70vh] flex flex-col" onMouseDown={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold text-[#3B3936]">{t('report_drilldown_title').replace('{title}', data.title)}</h2>
                    <button onClick={onClose}><XMarkIcon className="w-5 h-5"/></button>
                </header>
                <main className="flex-1 overflow-y-auto p-4">
                    <ul className="divide-y">
                        {data.items.map(item => (
                            <li key={item.id} className="py-2 flex justify-between">
                                <div>
                                    <p className="font-medium text-sm">{item.title}</p>
                                    <p className="text-xs text-gray-500">{item.id}</p>
                                </div>
                                <span className="text-xs">{item.status}</span>
                            </li>
                        ))}
                    </ul>
                </main>
            </div>
        </div>
    );
};