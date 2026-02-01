import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const APP_TZ = "America/Sao_Paulo";

export function getMonthPeriodSP(input: string | Date) {
  const base = dayjs(input).tz(APP_TZ);

  const start = base.startOf("month").toDate(); // instante UTC correspondente
  const end = base.endOf("month").toDate(); // idem

  return { start, end };
}
