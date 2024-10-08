import React from 'react';
import { Grid } from '@mui/material';
import EmpAttendanceChart from './EmpAttendanceChart';
import { gridSpacing } from 'store/constant';

import EmpTodayFlwLeadsCount from './EmpTodayFlwLeadsCount';
import EmpTodayRememberLeadsCount from './EmpTodayRememberLeadsCount';
import EmpCustCard from './EmpCustCard';

const EmpDashboard = () => {
  return (
    <>
      <Grid container spacing={gridSpacing}>
        <Grid item xs={12}>
          <EmpTodayFlwLeadsCount />
        </Grid>
        <Grid item container lg={8} md={12} sm={12} xs={12} spacing={gridSpacing}>
          <Grid item xs={12}>
            <EmpAttendanceChart />
          </Grid>
        </Grid>
        <Grid item container lg={4} md={12} sm={12} xs={12} spacing={gridSpacing}>
          <Grid item xs={12}>
            <EmpTodayRememberLeadsCount />
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default EmpDashboard;
