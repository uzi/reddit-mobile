import { FIRST_BIT } from 'app/constants';

export const getSleepAmount = (featureData) => {
  if (!featureData) {
    return 0;
  }

  switch (featureData.variant) {
    case FIRST_BIT.FIRST_BIT_1:
      return 500;
    case FIRST_BIT.FIRST_BIT_2:
      return 1000;
    case FIRST_BIT.FIRST_BIT_3:
      return 1500;
    default:
      return 0;
  }
};
