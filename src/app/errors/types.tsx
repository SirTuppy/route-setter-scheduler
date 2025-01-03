export type ErrorCode =
  | 'WALL_NOT_FOUND'
  | 'SETTER_NOT_FOUND'
  | 'INVALID_DATE'
  | 'SCHEDULE_CONFLICT'
  | 'DATA_FETCH_ERROR'
  | 'DATA_UPDATE_ERROR'

export class SchedulerError extends Error {
  code: ErrorCode;
  constructor(message: string, code: ErrorCode) {
    super(message);
      this.name = 'SchedulerError'
    this.code = code;
    Object.setPrototypeOf(this, SchedulerError.prototype);
  }
}

export const ErrorCodes = {
    WALL_NOT_FOUND: 'WALL_NOT_FOUND' as ErrorCode,
    SETTER_NOT_FOUND: 'SETTER_NOT_FOUND' as ErrorCode,
    INVALID_DATE: 'INVALID_DATE' as ErrorCode,
    SCHEDULE_CONFLICT: 'SCHEDULE_CONFLICT' as ErrorCode,
    DATA_FETCH_ERROR: 'DATA_FETCH_ERROR' as ErrorCode,
     DATA_UPDATE_ERROR: 'DATA_UPDATE_ERROR' as ErrorCode,
}