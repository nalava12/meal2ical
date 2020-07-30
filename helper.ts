import msgpack from '@ygoe/msgpack'
import { DayTimeOption, Option } from './index'

/*
t -> time
t[day].b -> time[day].breakfast
t[day].l -> time[day].lunch
t[day].d -> time[day].dinner
t.iA -> includeAllergy
t.iT -> includeTypes
i.iT.b -> breakfast
i.iT.l -> lunch
i.iT.d -> breakfast
*/

export function optionParse(encodedStr: string) {
  let option: Option = {
    time: {
      0: {
        breakfast: [7, 0, 8, 0],
        lunch: [12, 30, 13, 30],
        dinner: [17, 30, 18, 30]
      },
      1: {
        breakfast: [7, 0, 8, 0],
        lunch: [12, 30, 13, 30],
        dinner: [17, 30, 18, 30]
      },
      2: {
        breakfast: [7, 0, 8, 0],
        lunch: [12, 30, 13, 30],
        dinner: [17, 30, 18, 30]
      },
      3: {
        breakfast: [7, 0, 8, 0],
        lunch: [12, 30, 13, 30],
        dinner: [17, 30, 18, 30]
      },
      4: {
        breakfast: [7, 0, 8, 0],
        lunch: [12, 30, 13, 30],
        dinner: [17, 30, 18, 30]
      },
      5: {
        breakfast: [7, 0, 8, 0],
        lunch: [12, 30, 13, 30],
        dinner: [17, 30, 18, 30]
      },
      6: {
        breakfast: [7, 0, 8, 0],
        lunch: [12, 30, 13, 30],
        dinner: [17, 30, 18, 30]
      }
    },
    includeAllergy: true,
    includeTypes: {
      breakfast: true,
      lunch: true,
      dinner: true
    }
  };
  try {
    encodedStr = encodedStr.replace(/-/g, '+');
    encodedStr = encodedStr.replace(/_/g, '/');
    let msgPackData = Buffer.from(encodedStr, 'base64');
    let data = msgpack.decode(msgPackData);
    if (data.t) {
      for (let day in data.t) {
        for (let type in data.t[day]) {
          switch (type) {
            case 'b':
              option.time[day as unknown as (0 | 1 | 2 | 3 | 4 | 5 | 6)].breakfast = data.t[day].b;
              break;
            case 'l':
              option.time[day as unknown as (0 | 1 | 2 | 3 | 4 | 5 | 6)].lunch = data.t[day].l;
              break;
            case 'd':
              option.time[day as unknown as (0 | 1 | 2 | 3 | 4 | 5 | 6)].dinner = data.t[day].d;
              break;
          }
        }
      }
    }
    if (data.iA) {
      option.includeAllergy = data.iA;
    }
    if (data.iT) {
      for (let type in data.iT) {
        switch (type) {
          case 'b':
            option.includeTypes.breakfast = data.iT.b;
            break;
          case 'l':
            option.includeTypes.lunch = data.iT.l;
            break;
          case 'd':
            option.includeTypes.dinner = data.iT.d;
            break;
        }
      }
    }
  } finally {
    return option;
  }
}