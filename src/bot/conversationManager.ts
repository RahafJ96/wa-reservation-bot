import {
  createReservation,
  getReservation,
  updateReservation,
  cancelReservation,
} from '../api/reservationStore';
import { isValidDate, isValidTime, isValidGuests } from '../api/validation';
import { ConversationState, ReservationDraft } from '../types/chat-types';
import { ReservationStatus } from '../types/reservation-types';
import { analyzeUserMessage } from '../helper/gemini-start';

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

  // 2) User is choosing what to do
  if (state.step === 'choosingAction') {
    // Gemini
    let nlu: any = null;
    let intent = 'unknown';
    try {
      nlu = await analyzeUserMessage(message);
      intent = nlu?.intent ?? 'unknown';
      console.log('[NLU]', nlu);
    } catch (err) {
      console.error('[NLU] Error calling Gemini:', err);
    }

    const wantsNew =
      intent === 'new_reservation' ||
      lower.includes('new') ||
      lower.startsWith('1');

    const wantsModify =
      intent === 'modify_reservation' ||
      lower.includes('modify') ||
      lower.includes('update') ||
      lower.startsWith('2');

    const wantsCancel =
      intent === 'cancel_reservation' ||
      lower.includes('cancel') ||
      lower.startsWith('3');

    const wantsConfirmOrDetails =
      intent === 'confirm_reservation' ||
      lower.includes('confirm') ||
      lower.includes('details') ||
      lower.startsWith('4');

    // ✅ NEW RESERVATION
    if (wantsNew) {
      state.step = 'new_collecting';
      state.lastAction = 'new';

      // Start from existing draft
      const draft = state.draft;

      if (nlu) {
        if (nlu.date && !draft.date) draft.date = nlu.date;
        if (nlu.time && !draft.time) draft.time = nlu.time;
        if (nlu.guests && !draft.guests) draft.guests = nlu.guests;
        if (nlu.name && !draft.name) draft.name = nlu.name;
      }

      // If nothing prefilled yet → ask date first
      if (!draft.date && !draft.time && !draft.guests && !draft.name) {
        return (
          'Great! Let’s make a new reservation.\n' +
          'What date would you like? (YYYY-MM-DD)'
        );
      }

      // Otherwise, ask for the next missing field
      if (!draft.date) {
        return 'What date would you like? (YYYY-MM-DD)';
      }
      if (!draft.time) {
        return 'What time would you like? (HH:MM, 24h or 12h with AM/PM)';
      }
      if (!draft.guests) {
        return 'How many guests?';
      }
      if (!draft.name) {
        return 'Under what name should I make the reservation?';
      }

      // If everything is already filled → go straight to confirmation
      state.step = 'new_confirming';
      return (
        'Please confirm your reservation:\n' +
        buildReservationSummary(draft) +
        "\nReply 'yes' to confirm or 'no' to cancel."
      );
    }

    // ✏️ MODIFY
    if (wantsModify) {
      state.step = 'modify_collectingId';
      state.lastAction = 'modify';
      state.draft = {};
      return 'Please enter your reservation ID to modify it:';
    }

    // ❌ CANCEL
    if (wantsCancel) {
      state.step = 'cancel_collectingId';
      state.lastAction = 'cancel';
      state.draft = {};
      return 'Please enter your reservation ID to cancel it:';
    }

    // 🔍 SHOW RESERVATION DETAILS
    if (wantsConfirmOrDetails) {
      if (!state.lastReservationId) {
        return 'I don’t have any recent reservation in this conversation. Please enter your reservation ID.';
      }

      const reservation = getReservation(state.lastReservationId);
      if (!reservation) {
        return 'I could not find that reservation anymore. Please enter your reservation ID.';
      }

      return (
        'Here are your reservation details:\n' +
        `Reservation ID: ${reservation.id}\n` +
        buildReservationSummary(reservation) +
        '\nWhat would you like to do next?'
      );
    }

    if (intent === 'small_talk') {
      return "I'm your reservation assistant 😊 I can help you create, modify, or cancel a booking. What would you like to do?";
    }

    return "I didn't quite get that. Please type: new, modify, cancel, or confirm.";
  }

  // waiting for name/date/time/guests after we already know we're creating a new one
  if (state.step === 'new_collecting') {
    const draft = state.draft;

    // Ask for what is missing in a specific order: date, time, guests, name
    if (!draft.date) {
      const dateStr = lower;
      if (!isValidDate(dateStr)) {
        return 'The date is invalid or in the past. Please enter a date as YYYY-MM-DD (today or later):';
      }
      draft.date = dateStr;
    } else if (!draft.time) {
      const timeStr = message.trim();
      if (!isValidTime(timeStr)) {
        return 'The time format is invalid. Use HH:MM (24h) or e.g. 2:30 PM / 9am:';
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

  // confirming
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

      state.lastReservationId = reservation.id;
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

    if (reservation.status === ReservationStatus.CANCELLED) {
      return "This reservation is already been cancelled and can't be modified. Please enter a different reservation ID:";
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

    state.lastReservationId = updated.id;
    resetState(state);

    return (
      '✅ Your reservation has been updated.\n' +
      `Reservation ID: ${updated.id}\n` +
      buildReservationSummary(updated) +
      '\nWhat would you like to do next?'
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
      `Reservation ID: ${cancelled.id}\n` +
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
