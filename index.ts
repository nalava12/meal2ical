import School from 'school-kr';
import Koa from 'koa';
import * as ics from 'ics';
import { optionParse } from './helper';
import serve from 'koa-static';

let school = new School();
school.init(School.Type.HIGH, School.Region.GYEONGNAM, 'S100000693');

export type DayTimeOption = {
  breakfast: [number, number, number, number], // [start hour, start minute, end hour, end minute]
  lunch: [number, number, number, number],
  dinner: [number, number, number, number]
}

export interface Option {
  time: {
    0: DayTimeOption;
    1: DayTimeOption;
    2: DayTimeOption;
    3: DayTimeOption;
    4: DayTimeOption;
    5: DayTimeOption;
    6: DayTimeOption;
  };
  includeAllergy: boolean;
  includeTypes: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
}

const mealCache: Map<string, (string | undefined)[]> = new Map(); // Map<yearmonth, meals>

const app = new Koa();

app.use(async (ctx, next) => {
  await next();
  let now = new Date();
  console.log(`[${now.toISOString()}] ${ctx.method} ${ctx.url}`);
});

app.use(serve('frontend/dist/'));

app.use(async ctx => {
  let today = new Date();
  let currMeals: (string | undefined)[] = [];
  if (mealCache.has(`${today.getFullYear()}${today.getMonth()}`)) {
    currMeals = mealCache.get(`${today.getFullYear()}${today.getMonth()}`)!!;
  } else {
    currMeals = Array.from({
      ...await school.getMeal(),
      length: 31
    });
    mealCache.set(`${today.getFullYear()}${today.getMonth()}`, currMeals);
  }

  let nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  let nextMeals: (string | undefined)[] = [];
  if (mealCache.has(`${nextMonth.getFullYear()}${nextMonth.getMonth()}`)) {
    nextMeals = mealCache.get(`${nextMonth.getFullYear()}${nextMonth.getMonth()}`)!!;
  } else {
    nextMeals = Array.from({
      ...await school.getMeal(nextMonth.getFullYear(), nextMonth.getMonth() + 1),
      length: 31
    });
    mealCache.set(`${nextMonth.getFullYear()}${nextMonth.getMonth()}`, nextMeals);
  }

  let options = optionParse(ctx.path.substring(1));
  let events: ics.EventAttributes[] = [];

  [currMeals, nextMeals].forEach((monthlyMeals, month) => {
    monthlyMeals.forEach((meal, ind) => {
      let breakfast: string | undefined;
      let lunch: string | undefined;
      let dinner: string | undefined;
      if(!options.includeAllergy) {
        meal = meal?.replace(/(\d+\.)+$/gm, '');
      }
      if (meal?.includes('[조식]')) {
        breakfast = meal.split('[조식]\n')[1].split('[중식]')[0];
      }
      if (meal?.includes('[중식]')) {
        lunch = meal.split('[중식]\n')[1].split('[석식]')[0];
      }
      if (meal?.includes('[석식]')) {
        dinner = meal.split('[석식]\n')[1];
      }

      let curDate = new Date(today.getFullYear(), today.getMonth() + month, ind);
      let time = options.time[curDate.getDay() as keyof typeof options.time];

      if ((breakfast ?? '').length !== 0 && options.includeTypes.breakfast) {
        let start: ics.DateArray = [today.getFullYear(), today.getMonth() + month + 1, ind, time.breakfast[0], time.breakfast[1]];
        let end: ics.DateArray = [today.getFullYear(), today.getMonth() + month + 1, ind, time.breakfast[2], time.breakfast[3]];
        events.push({
          start,
          end,
          title: '조식',
          description: breakfast
        })
      }
      if ((lunch ?? '').length !== 0 && options.includeTypes.lunch) {
        let start: ics.DateArray = [today.getFullYear(), today.getMonth() + month + 1, ind, time.lunch[0], time.lunch[1]];
        let end: ics.DateArray = [today.getFullYear(), today.getMonth() + month + 1, ind, time.lunch[2], time.lunch[3]];
        events.push({
          start,
          end,
          title: '중식',
          description: lunch
        })
      }
      if ((dinner ?? '').length !== 0 && options.includeTypes.dinner) {
        let start: ics.DateArray = [today.getFullYear(), today.getMonth() + month + 1, ind, time.dinner[0], time.dinner[1]];
        let end: ics.DateArray = [today.getFullYear(), today.getMonth() + month + 1, ind, time.dinner[2], time.dinner[3]];
        events.push({
          start,
          end,
          title: '석식',
          description: dinner
        });
      }
    })
  });
  ctx.body = ics.createEvents(events).value;
  ctx.res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
});

console.log(`[${new Date().toISOString()}] Server is listening at port 3000`);
app.listen(3000);