type ConversationStep =
  | 'idle'
  | 'choosingAction'
  | 'new_collecting'
  | 'new_confirming'
  | 'modify_collectingId'
  | 'modify_collectingField'
  | 'modify_collectingValue'
  | 'cancel_collectingId';

type LastAction = 'new' | 'modify' | 'cancel' | 'confirm' | null;

export interface ReservationDraft {
  reservationId?: string;
  name?: string;
  date?: string;
  time?: string;
  guests?: number;
  fieldToModify?: 'name' | 'date' | 'time' | 'guests';
}

export interface ConversationState {
  step: ConversationStep;
  lastAction: LastAction;
  draft: ReservationDraft;
  lastReservationId?: string;
}
export interface HELPResult {
  intent:
    | 'new_reservation'
    | 'modify_reservation'
    | 'cancel_reservation'
    | 'confirm_reservation'
    | 'unknown';
  date: string | null;
  time: string | null;
  guests: number | null;
  name: string | null;
  notes: string;
}
