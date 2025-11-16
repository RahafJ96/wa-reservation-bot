import {
  createReservation,
  getReservation,
  updateReservation,
  cancelReservation,
} from '../api/reservationStore';
import { isValidDate, isValidTime, isValidGuests } from '../api/validation';
import { ConversationState, ReservationDraft } from '../types/chat-types';

const conversations = new Map<string, ConversationState>();

function getOrCreateState(conversationId: string): ConversationState {
  let state = conversations.get(conversationId);
  if (!state) {
    state = {
      step: 'idle',
      lastAction: null,
      draft: {},
    };
    conversations.set(conversationId, state);
  }
  return state;
}

function resetState(state: ConversationState) {
  state.step = 'choosingAction';
  state.lastAction = null;
  state.draft = {};
}

function buildReservationSummary(draft: ReservationDraft) {
  return `- Name: ${draft.name}\n- Date: ${draft.date}\n- Time: ${draft.time}\n- Guests: ${draft.guests}`;
}

export async function handleUserMessage(
  conversationId: string,
  message: string
): Promise<string> {
  const state = getOrCreateState(conversationId);
  const lower = message.trim().toLowerCase();

  // 1) First-time greeting or idle state
  if (state.step === 'idle') {
    state.step = 'choosingAction';
    return (
      'Hello! I can help you with restaurant reservations.\n' +
      'What would you like to do?\n' +
      '1) New reservation\n' +
      '2) Modify reservation\n' +
      '3) Cancel reservation\n' +
      '4) Confirm (see details)\n' +
      "Please type something like 'new reservation', 'modify', 'cancel', or 'confirm'."
    );
  }

  // 2) Handle field-specific steps
  if (state.step === 'choosingAction') {
    if (lower.includes('new')) {
      state.step = 'new_collecting';
      state.lastAction = 'new';
      state.draft = {};
      return 'Great! Let’s make a new reservation.\nWhat date would you like? (YYYY-MM-DD)';
    }

    if (lower.includes('modify')) {
      state.step = 'modify_collectingId';
      state.lastAction = 'modify';
      state.draft = {};
      return 'Please enter your reservation ID to modify it:';
    }

    if (lower.includes('cancel')) {
      state.step = 'cancel_collectingId';
      state.lastAction = 'cancel';
      state.draft = {};
      return 'Please enter your reservation ID to cancel it:';
    }

    if (lower.includes('confirm')) {
      // Here you could show the draft or ask for an ID, depending on your design
      return 'Please enter your reservation ID to see the details:';
    }

    return "I didn't quite get that. Please type: new, modify, cancel, or confirm.";
  }

  // NEW: waiting for name/date/time/guests after we already know we're creating a new one
  if (state.step === 'new_collecting') {
    const draft = state.draft;

    // Ask for what is missing in a specific order: date, time, guests, name
    if (!draft.date) {
      const dateStr = lower;
      if (!isValidDate(dateStr)) {
        return 'The date format is invalid. Please enter date as YYYY-MM-DD:';
      }
      draft.date = dateStr;
    } else if (!draft.time) {
      const timeStr = lower;
      if (!isValidTime(timeStr)) {
        return 'The time format is invalid. Please enter time as HH:MM in 24h format:';
      }
      draft.time = timeStr;
    } else if (!draft.guests) {
      const guestsNum = Number(lower);
      if (!isValidGuests(guestsNum)) {
        return 'Guests must be a number between 1 and 20. Please enter the number of guests:';
      }
      draft.guests = guestsNum;
    } else if (!draft.name) {
      draft.name = message.trim();
    }

    // Check if all fields are filled now
    if (draft.date && draft.time && draft.guests && draft.name) {
      state.step = 'new_confirming';
      state.lastAction = 'new';
      return (
        'Please confirm your reservation:\n' +
        buildReservationSummary(draft) +
        "\nReply 'yes' to confirm or 'no' to cancel."
      );
    }

    // Ask for next missing field
    if (!draft.date) return 'What date would you like? (YYYY-MM-DD)';
    if (!draft.time) return 'What time would you like? (HH:MM, 24h format)';
    if (!draft.guests) return 'How many guests?';
    if (!draft.name) return 'Under what name should I make the reservation?';

    // Should not reach here
    return "Let's continue your reservation. Please provide the missing details.";
  }

  // NEW: confirming
  if (state.step === 'new_confirming' && state.lastAction === 'new') {
    if (lower === 'yes' || lower === 'y') {
      const draft = state.draft;
      if (!draft.name || !draft.date || !draft.time || !draft.guests) {
        state.step = 'new_collecting';
        return "Some details are missing. Let's collect them again.";
      }

      const reservation = createReservation({
        name: draft.name,
        date: draft.date,
        time: draft.time,
        guests: draft.guests,
      });

      resetState(state);
      return (
        '✅ Your reservation is confirmed!\n' +
        `Reservation ID: ${reservation.id}\n` +
        buildReservationSummary(reservation) +
        '\n\nWhat would you like to do next?'
      );
    } else if (lower === 'no' || lower === 'n') {
      resetState(state);
      return 'Okay, the reservation was not created. What would you like to do instead (new / modify / cancel)?';
    } else {
      return "Please reply with 'yes' or 'no'.";
    }
  }

  // MODIFY: waiting for reservation ID
  if (state.step === 'modify_collectingId') {
    const id = message.trim();
    const reservation = getReservation(id);
    if (!reservation) {
      return "I couldn't find a reservation with that ID. Please check and enter the correct reservation ID:";
    }
    state.draft.reservationId = id;
    state.step = 'modify_collectingField';
    return (
      'Found your reservation.\n' +
      'What would you like to change? (date / time / guests / name)'
    );
  }

  // MODIFY: waiting for which field
  if (state.step === 'modify_collectingField') {
    if (['date', 'time', 'guests', 'name'].includes(lower)) {
      state.draft.fieldToModify = lower as any;
      state.step = 'modify_collectingValue';
      return `What is the new ${lower}?`;
    }
    return 'Please type which field you want to change: date, time, guests, or name.';
  }

  // MODIFY: waiting for new value
  if (state.step === 'modify_collectingValue') {
    const draft = state.draft;
    const id = draft.reservationId;
    const field = draft.fieldToModify;

    if (!id || !field) {
      resetState(state);
      return "Something went wrong with the modification flow. Let's start again. What would you like to do (new / modify / cancel)?";
    }

    const newValue = message.trim();

    const updates: any = {};
    if (field === 'date') {
      if (!isValidDate(newValue)) {
        return 'Invalid date format. Please enter date as YYYY-MM-DD:';
      }
      updates.date = newValue;
    } else if (field === 'time') {
      if (!isValidTime(newValue)) {
        return 'Invalid time format. Please enter time as HH:MM in 24h format:';
      }
      updates.time = newValue;
    } else if (field === 'guests') {
      const guestsNum = Number(newValue);
      if (!isValidGuests(guestsNum)) {
        return 'Guests must be a number between 1 and 20. Please enter the number of guests:';
      }
      updates.guests = guestsNum;
    } else if (field === 'name') {
      updates.name = newValue;
    }

    const updated = updateReservation(id, updates);
    if (!updated) {
      resetState(state);
      return "I couldn't find that reservation anymore. Let's start over. What would you like to do?";
    }

    resetState(state);
    return (
      '✅ Your reservation has been updated.\n' +
      `Reservation ID: ${updated.id}\n` +
      buildReservationSummary(updated) +
      '\n\nWhat would you like to do next?'
    );
  }

  // CANCEL: waiting for reservation ID
  if (state.step === 'cancel_collectingId') {
    const id = message.trim();
    const cancelled = cancelReservation(id);
    if (!cancelled) {
      return "I couldn't find a reservation with that ID. Please check and enter the correct reservation ID:";
    }
    resetState(state);
    return (
      '✅ Your reservation has been cancelled.\n' +
      `Reservation ID: ${cancelled.id}\n\n` +
      'What would you like to do next?'
    );
  }

  // Fallback for any unexpected state
  resetState(state);
  return (
    "Let's start over.\n" +
    'What would you like to do?\n' +
    '1) New reservation\n2) Modify\n3) Cancel\n4) Confirm'
  );
}
