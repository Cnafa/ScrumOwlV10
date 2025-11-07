// services/analyticsService.ts
import { WorkItem, Epic, User, Status, EpicProgressReportData, AssigneeWorkloadData, Sprint } from '../types';
import { SPRINTS, WIP_LIMIT } from '../constants';

// --- Burndown Chart Logic ---
export const getBurndownData = (sprintId: string, workItems: WorkItem[]) => {
    const sprintItems = workItems.filter(item => item.sprintId === sprintId);
    if (sprintItems.length === 0) return { labels: [], ideal: [], actual: [] };
    
    const sprintDuration = 14; // Assume 14 days for mock
    const labels = Array.from({ length: sprintDuration + 1 }, (_, i) => `Day ${i}`);
    
    const totalPoints = sprintItems.reduce((sum, item) => sum + (item.estimationPoints || 0), 0);
    
    // Ideal line: linear descent
    const ideal = labels.map((_, i) => totalPoints - (totalPoints / sprintDuration) * i);
    
    // Actual line: calculated based on completion date
    let remainingPoints = totalPoints;
    const actual = [totalPoints];
    for (let i = 1; i <= sprintDuration; i++) {
        // This is a simplification. A real implementation would use transition logs.
        const completedThisDay = sprintItems.filter(item => {
            const dayOfSprint = (new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime()) / (1000 * 3600 * 24);
            return item.status === Status.DONE && Math.ceil(dayOfSprint) === i;
        }).reduce((sum, item) => sum + (item.estimationPoints || 0), 0);
        
        remainingPoints -= completedThisDay;
        actual.push(remainingPoints);
    }

    return { labels, ideal, actual, totalPoints };
};

// --- Velocity Chart Logic ---
export const getVelocityData = (workItems: WorkItem[], sprints: Sprint[]) => {
    const sprintNames = sprints.map(s => s.name);
    const velocityBySprint: Record<string, number> = {};
    sprintNames.forEach(name => {
        velocityBySprint[name] = 0;
    });

    workItems
        .filter(item => item.status === Status.DONE && item.doneInSprintId)
        .forEach(item => {
            const sprintName = sprints.find(s => s.id === item.doneInSprintId)?.name;
            if (sprintName && velocityBySprint.hasOwnProperty(sprintName)) {
                velocityBySprint[sprintName] += item.estimationPoints || 0;
            }
        });
        
    const labels = Object.keys(velocityBySprint);
    const data = Object.values(velocityBySprint);
    const average = data.length > 0 ? data.reduce((a, b) => a + b, 0) / data.length : 0;

    return { labels, data, average };
};


// --- Epics Progress Logic ---
export const getEpicProgressData = (enrichedEpics: Epic[]): EpicProgressReportData[] => {
    return enrichedEpics.map(epic => {
        const totalItems = epic.totalItemsCount || 0;
        const doneItems = totalItems - (epic.openItemsCount || 0);
        const totalEstimation = epic.totalEstimation || 0;
        const progress = epic.percentDoneWeighted || 0;
        const doneEstimation = totalEstimation * (progress / 100);
        
        return {
            epic,
            totalItems,
            doneItems,
            totalEstimation,
            doneEstimation: Math.round(doneEstimation),
            progress,
        };
    }).sort((a,b) => b.epic.iceScore - a.epic.iceScore);
};

// --- Assignee Workload Logic ---
export const getAssigneeWorkloadData = (workItems: WorkItem[], users: User[]): AssigneeWorkloadData[] => {
    const workloadMap: Record<string, { open: number, inProgress: number, inReview: number, totalLoad: number }> = {};

    users.forEach(user => {
        workloadMap[user.id] = { open: 0, inProgress: 0, inReview: 0, totalLoad: 0 };
    });

    workItems.forEach(item => {
        if (item.assignees && item.assignees.length > 0) {
            item.assignees.forEach(assignee => {
                if (workloadMap[assignee.id]) {
                    if (item.status === Status.TODO || item.status === Status.BACKLOG) {
                        workloadMap[assignee.id].open++;
                    } else if (item.status === Status.IN_PROGRESS) {
                        workloadMap[assignee.id].inProgress++;
                    } else if (item.status === Status.IN_REVIEW) {
                        workloadMap[assignee.id].inReview++;
                    }
                }
            });
        }
    });

    return users.map(user => {
        const stats = workloadMap[user.id];
        const totalLoad = stats.open + stats.inProgress + stats.inReview;
        return {
            assignee: user,
            ...stats,
            totalLoad,
            wipBreached: stats.inProgress > WIP_LIMIT,
        };
    }).sort((a,b) => b.totalLoad - a.totalLoad);
};