import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useTheme, styled } from '@mui/material/styles';
import { Typography, Box, Avatar, Grid } from '@mui/material';
import { FaUsers, FaDollarSign, FaFileInvoice, FaUser } from 'react-icons/fa';
import MainCard from 'ui-component/cards/MainCard';
import config from '../../config';
import './card1.css'; // Import the custom CSS

const EmpTodayFlwLeadsCount = () => {
  const theme = useTheme();
  const empId = sessionStorage.getItem('emp_id');
  const [leadsCount, setLeadsCount] = useState({
    leads_followed_today: 0,
    total_sales_value_today: 0,
    invoice_count_today: 0
  });
  const [leadNames, setLeadNames] = useState([]);
  const [showLeadNames, setShowLeadNames] = useState(false);
  const [custCount, setCustCount] = useState(0); // Initialize as 0
  const [loading, setLoading] = useState(true); // Loading state
  const [invoiceDetails, setInvoiceDetails] = useState([]);
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const empId = sessionStorage.getItem('emp_id');
        if (!empId) {
          console.error('Employee ID is not set in session storage.');
          setLoading(false);
          return;
        }

        const res = await axios.get(`${config.apiUrl}/quotation/empDashBoard/${empId}`);
        const custRes = await axios.get(`${config.apiUrl}/customer/getCustomerByEmpId/${empId}`);

        setLeadsCount(res.data);
        setLeadNames(res.data.leads_names_today ? leadsRes.data.leads_names_today.split(',') : []);
        setInvoiceDetails(res.data.invoice_details_today ? leadsRes.data.invoice_details_today.split(', ') : []);
        setCustCount(custRes.data.length);
        setLoading(false); // Set loading to false after fetching
      } catch (err) {
        console.error("Data can't be fetched:", err.response ? err.response.data : err.message);
        setLoading(false); // Also set loading to false on error
      }
    };

    fetchData();
  }, [empId]);

  const handleCardClick = () => {
    setShowLeadNames(!showLeadNames);
  };

  const handleInvoiceCardClick = () => {
    setShowInvoiceDetails(!showInvoiceDetails);
  };

  if (loading) {
    return <Typography align="center">Loading...</Typography>; // Loading indicator
  }

  return (
    <Grid container spacing={2} sx={{ width: '100%', marginTop: '15px' }}>
      {/* Total Sales Value Card */}
      <Grid item xs={12} sm={6} md={3}>
        <MainCard className="cust-card1">
          <Box sx={{ p: 2 }}>
            <Box display="flex" justifyContent="center" mb={1}>
              <Avatar sx={{ bgcolor: theme.palette.info.dark, height: 50, width: 50 }}>
                <FaDollarSign size={30} color="white" />
              </Avatar>
            </Box>
            <Typography variant="h5" className="cust-card-heading" align="center">
              Today Sales Value
            </Typography>
            <Typography variant="h4" className="cust-value" align="center">
              ₹{leadsCount.total_sales_value_today}
            </Typography>
          </Box>
        </MainCard>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MainCard className="cust-card2">
          <Box sx={{ p: 2 }}>
            <Box display="flex" justifyContent="center" mb={1}>
              <Avatar sx={{ bgcolor: theme.palette.primary.dark, height: 50, width: 50 }}>
                <FaUser size={30} color="white" />
              </Avatar>
            </Box>
            <Typography variant="h5" className="cust-card-heading" align="center">
              Customers
            </Typography>
            <Typography variant="h4" className="cust-value" align="center">
              {custCount}
            </Typography>
          </Box>
        </MainCard>
      </Grid>
      {/* Total Follow Leads Card */}
      <Grid item xs={12} sm={6} md={3}>
        <MainCard className="cust-card3" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
          <Box sx={{ p: 2 }}>
            <Box display="flex" justifyContent="center" mb={1}>
              <Avatar sx={{ bgcolor: theme.palette.success.dark, height: 50, width: 50 }}>
                <FaUsers size={30} color="white" />
              </Avatar>
            </Box>
            <Typography variant="h5" className="cust-card-heading" align="center">
              Today Follow Leads
            </Typography>
            <Typography variant="h4" className="cust-value" align="center">
              {leadsCount.leads_followed_today}
            </Typography>
          </Box>
        </MainCard>
        {showLeadNames && (
          <Box
            sx={{
              mt: 1,
              p: 1,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper
            }}
          >
            <Typography variant="subtitle1" align="center" color="primary" mb={1}>
              Today's Followed Leads:
            </Typography>
            {leadNames.length > 0 ? (
              leadNames.map((name, index) => (
                <Box
                  key={index}
                  sx={{
                    backgroundColor: theme.palette.grey[200],
                    borderRadius: 1,
                    padding: '5px',
                    marginBottom: '5px',
                    boxShadow: 1,
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="body2">{`Name: ${name}`}</Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" align="center">
                No leads followed today.
              </Typography>
            )}
          </Box>
        )}
      </Grid>

      {/* Total Invoices Card */}
      {/* Invoices Card */}
      <Grid item xs={12} sm={6} md={3}>
        <MainCard className="cust-card4" onClick={handleInvoiceCardClick} style={{ cursor: 'pointer' }}>
          <Box sx={{ p: 2 }}>
            <Box display="flex" justifyContent="center" mb={1}>
              <Avatar sx={{ bgcolor: theme.palette.warning.dark, height: 50, width: 50 }}>
                <FaFileInvoice size={30} color="white" />
              </Avatar>
            </Box>
            <Typography variant="h5" className="cust-card-heading" align="center">
              Today Invoices
            </Typography>
            <Typography variant="h4" className="cust-value" align="center">
              {leadsCount.invoice_count_today}
            </Typography>
          </Box>
        </MainCard>
        {showInvoiceDetails && (
          <Box
            sx={{
              mt: 1,
              p: 1,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper
            }}
          >
            <Typography variant="subtitle1" align="center" color="primary" mb={1}>
              Today's Invoices:
            </Typography>
            {invoiceDetails.length > 0 ? (
              invoiceDetails.map((detail, index) => (
                <Box
                  key={index}
                  sx={{
                    backgroundColor: theme.palette.grey[200],
                    borderRadius: 1,
                    padding: '5px',
                    marginBottom: '5px',
                    boxShadow: 1,
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="body2">{detail}</Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" align="center">
                No invoices today.
              </Typography>
            )}
          </Box>
        )}
      </Grid>
    </Grid>
  );
};

export default EmpTodayFlwLeadsCount;
