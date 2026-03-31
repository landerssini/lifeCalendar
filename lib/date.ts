const MS_PER_WEEK = 1000 * 60 * 60 * 24 * 7;
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const TOTAL_WEEKS = 52 * 100;

export type CalendarViewMode = "birthday" | "real";

function startOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getUtcDayNumber(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY;
}

function getCalendarDayDifference(startDate: Date, endDate: Date) {
  return getUtcDayNumber(endDate) - getUtcDayNumber(startDate);
}

export function getWeeksLived(birthDate: Date, referenceDate: Date = new Date()): number {
  const birthTime = birthDate.getTime();
  const now = referenceDate.getTime();

  if (Number.isNaN(birthTime) || birthTime > now) {
    return 0;
  }

  return Math.min(
    TOTAL_WEEKS,
    Math.floor(getCalendarDayDifference(birthDate, referenceDate) / 7),
  );
}

export function getDaysLived(birthDate: Date, referenceDate: Date = new Date()): number {
  const birthTime = birthDate.getTime();
  const now = referenceDate.getTime();

  if (Number.isNaN(birthTime) || birthTime > now) {
    return 0;
  }

  return getCalendarDayDifference(birthDate, referenceDate);
}

export function getYearsLived(birthDate: Date, referenceDate: Date = new Date()): number {
  const today = startOfDay(referenceDate);
  let years = today.getFullYear() - birthDate.getFullYear();
  const hasNotHadBirthdayYet =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());

  if (hasNotHadBirthdayYet) {
    years -= 1;
  }

  return Math.max(0, years);
}

export function getNextWeekMarkDate(birthDate: Date, referenceDate: Date = new Date()): Date {
  const weeksLived = getWeeksLived(birthDate, referenceDate);
  const nextWeek = new Date(birthDate);
  nextWeek.setHours(0, 0, 0, 0);
  nextWeek.setDate(nextWeek.getDate() + (weeksLived + 1) * 7);
  return nextWeek;
}

export function getLastWeekMarkDate(
  birthDate: Date,
  referenceDate: Date = new Date()
): Date | null {
  const weeksLived = getWeeksLived(birthDate, referenceDate);

  if (weeksLived <= 0) {
    return null;
  }

  const lastWeek = new Date(birthDate);
  lastWeek.setHours(0, 0, 0, 0);
  lastWeek.setDate(lastWeek.getDate() + weeksLived * 7);
  return lastWeek;
}

export function getCurrentBirthday(birthDate: Date, referenceDate: Date = new Date()): Date {
  const today = startOfDay(referenceDate);

  const currentBirthday = new Date(
    today.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate(),
    0,
    0,
    0,
    0
  );

  if (currentBirthday > today) {
    currentBirthday.setFullYear(currentBirthday.getFullYear() - 1);
  }

  return currentBirthday;
}

export function getNextBirthday(birthDate: Date, referenceDate: Date = new Date()): Date {
  const nextBirthday = new Date(getCurrentBirthday(birthDate, referenceDate));
  nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
  return nextBirthday;
}

export function getBirthdayRowWeeksLived(
  birthDate: Date,
  referenceDate: Date = new Date()
): number {
  const currentBirthday = getCurrentBirthday(birthDate, referenceDate);
  const today = startOfDay(referenceDate);

  return Math.min(
    52,
    Math.floor(getCalendarDayDifference(currentBirthday, today) / 7),
  );
}

export function getVisualWeeksLivedByBirthdayRows(
  birthDate: Date,
  referenceDate: Date = new Date()
): number {
  const completedYears = getYearsLived(birthDate, referenceDate);
  const currentRowWeeks = getBirthdayRowWeeksLived(birthDate, referenceDate);

  return Math.min(TOTAL_WEEKS, completedYears * 52 + currentRowWeeks);
}

export function getDisplayedWeeksLived(
  mode: CalendarViewMode,
  birthDate: Date,
  referenceDate: Date = new Date()
) {
  return mode === "real"
    ? getWeeksLived(birthDate, referenceDate)
    : getVisualWeeksLivedByBirthdayRows(birthDate, referenceDate);
}

export function getNextBirthdayRowMarkDate(
  birthDate: Date,
  referenceDate: Date = new Date()
): Date {
  const currentBirthday = getCurrentBirthday(birthDate, referenceDate);
  const currentRowWeeks = getBirthdayRowWeeksLived(birthDate, referenceDate);

  if (currentRowWeeks >= 52) {
    const firstPointNextRow = getNextBirthday(birthDate, referenceDate);
    firstPointNextRow.setDate(firstPointNextRow.getDate() + 7);
    return firstPointNextRow;
  }

  const nextMark = new Date(currentBirthday);
  nextMark.setDate(nextMark.getDate() + (currentRowWeeks + 1) * 7);
  return nextMark;
}

export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
}

export function getWeekDateLabel(birthDate: Date, weekIndex: number): string {
  const weekStart = new Date(birthDate);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() + (weekIndex + 1) * 7);

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(weekStart);
}

export function getBirthdayRowWeekDateLabel(birthDate: Date, weekIndex: number): string {
  const row = Math.floor(weekIndex / 52);
  const weekInRow = weekIndex % 52;
  const rowStart = new Date(birthDate);
  rowStart.setHours(0, 0, 0, 0);
  rowStart.setFullYear(rowStart.getFullYear() + row);
  rowStart.setDate(rowStart.getDate() + (weekInRow + 1) * 7);

  return formatLongDate(rowStart);
}

export function getDisplayedWeekDateLabel(
  mode: CalendarViewMode,
  birthDate: Date,
  weekIndex: number
) {
  return mode === "real"
    ? getWeekDateLabel(birthDate, weekIndex)
    : getBirthdayRowWeekDateLabel(birthDate, weekIndex);
}

export function getDisplayedNextMarkDate(
  mode: CalendarViewMode,
  birthDate: Date,
  referenceDate: Date = new Date()
) {
  return mode === "real"
    ? getNextWeekMarkDate(birthDate, referenceDate)
    : getNextBirthdayRowMarkDate(birthDate, referenceDate);
}

export function isDisplayedPointMarkDay(
  mode: CalendarViewMode,
  birthDate: Date,
  referenceDate: Date = new Date()
) {
  const today = startOfDay(referenceDate);
  const previousDay = new Date(today);
  previousDay.setDate(previousDay.getDate() - 1);

  const nextMarkFromPreviousDay = getDisplayedNextMarkDate(mode, birthDate, previousDay);
  return isSameDay(startOfDay(nextMarkFromPreviousDay), today);
}

export function getHundredthBirthday(birthDate: Date): Date {
  const hundredthBirthday = new Date(birthDate);
  hundredthBirthday.setHours(0, 0, 0, 0);
  hundredthBirthday.setFullYear(hundredthBirthday.getFullYear() + 100);
  return hundredthBirthday;
}
