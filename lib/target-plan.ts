export function targetPlan(answers: Record<string, unknown>, start: Date) {
  const text = (key: string) => typeof answers[key] === 'string' ? String(answers[key]).trim() : '';
  const horizon = text('e1_horizon');
  const end = new Date(start);
  if (horizon === '90 days') end.setUTCDate(end.getUTCDate() + 90);
  else {
    const day = end.getUTCDate();
    end.setUTCDate(1);
    end.setUTCMonth(end.getUTCMonth() + ({ '6 months':6, '9 months':9, '12 months':12 }[horizon] ?? 3));
    const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
    end.setUTCDate(Math.min(day,last));
  }
  const date = (value: Date) => value.toISOString().slice(0,10);
  const cadence = text('e3_checkin').toLowerCase().includes('month') ? 'monthly' : text('e3_checkin').toLowerCase().includes('two') ? 'biweekly' : 'weekly';
  return ['e2_m1','e2_m2','e2_m3'].flatMap((key,index) => text(key) ? [{
    title:text(key), why:text('e1_goal'), successMetric:index === 2 ? text('e1_success') || text(key) : text(key),
    startDate:date(start), dueDate:date(new Date(start.getTime() + (end.getTime()-start.getTime()) * (index+1)/3)), cadence,
  }] : []);
}
