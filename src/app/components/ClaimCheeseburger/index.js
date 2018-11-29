import CustomAdFlair from 'app/components/CustomAdFlair';

import './style.less';

const ClaimCheeseburger = () => (
  <span className='ClaimCheeseburger'>
    <span>
      Get your McDonald’s burger
    </span>
    <span className='ClaimCheeseburger__right'>
      <CustomAdFlair />
    </span>
  </span>
);

export default ClaimCheeseburger;
