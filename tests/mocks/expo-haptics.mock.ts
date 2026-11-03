export enum NotificationFeedbackType {
    Success = 'success',
    Warning = 'warning',
    Error = 'error',
}

export enum ImpactFeedbackStyle {
    Light = 'light',
    Medium = 'medium',
    Heavy = 'heavy',
}

export async function notificationAsync() {
    return Promise.resolve();
}

export async function impactAsync() {
    return Promise.resolve();
}
