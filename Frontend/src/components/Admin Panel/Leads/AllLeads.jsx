import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Typography,
  Button
} from '@mui/material';
import { utils, writeFile } from 'xlsx';
import config from '../../../config';

// Utility function to format date
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const LeadsList = () => {
  const [leads, setLeads] = useState([]);
  const [followingLeads, setFollowingLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchLeadsAndFollowing = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${config.apiUrl}/employee/api/leads-and-following`);
        const { leads, followingLeads } = response.data;

        // Ensure data is an array
        if (Array.isArray(leads) && Array.isArray(followingLeads)) {
          setLeads(leads);
          setFollowingLeads(followingLeads);
          setFilteredLeads(leads); // Set both leads and filteredLeads initially
        } else {
          console.error('Expected arrays of leads and following leads data');
        }
      } catch (error) {
        console.error('Error fetching data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeadsAndFollowing();
  }, []);

  // Automatically apply filter when date or month changes
  useEffect(() => {
    let filtered = Array.isArray(leads) ? [...leads] : [];

    if (selectedDate) {
      filtered = filtered.filter((lead) => new Date(lead.QUERY_TIME).toDateString() === new Date(selectedDate).toDateString());
    } else if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      filtered = filtered.filter((lead) => {
        const leadDate = new Date(lead.QUERY_TIME);
        return leadDate.getFullYear() === parseInt(year) && leadDate.getMonth() + 1 === parseInt(month);
      });
    }

    setFilteredLeads(filtered);
    setPage(0); // Reset pagination to the first page when filtering
  }, [selectedDate, selectedMonth, leads]);

  // Handle date selection
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedMonth(''); // Clear month selection when date is selected
  };

  // Handle month selection
  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
    setSelectedDate(''); // Clear date selection when month is selected
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset pagination to first page when changing rows per page
  };

  // Calculate paginated data
  const paginatedLeads = filteredLeads.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Match leads with followingLeads
  const getRowStyle = (leadId) => {
    return followingLeads.some((follow) => follow.leads_id === leadId) ? { backgroundColor: 'lightgreen' } : {};
  };

  // Export leads data to Excel
  const exportToExcel = async () => {
    setLoading(true);

    try {
      // Build query parameters based on filters
      const params = new URLSearchParams();
      if (selectedDate) {
        params.append('selectedDate', selectedDate);
      } else if (selectedMonth) {
        params.append('selectedMonth', selectedMonth);
      }

      // Call the API with the appropriate filters
      const response = await axios.get(`${config.apiUrl}/leads/api/leads-data?${params.toString()}`);
      const leadsData = response.data;

      // Format the data for Excel export
      const formattedData = leadsData.map((lead) => ({
        'Query ID': lead.UNIQUE_QUERY_ID,
        'Query Type': lead.QUERY_TYPE,
        'Query Time': lead.QUERY_TIME,
        'Sender Name': lead.SENDER_NAME,
        'Sender Mobile': lead.SENDER_MOBILE,
        'Sender Email': lead.SENDER_EMAIL,
        Subject: lead.SUBJECT,
        Company: lead.SENDER_COMPANY,
        Address: lead.SENDER_ADDRESS,
        City: lead.SENDER_CITY,
        State: lead.SENDER_STATE,
        Pincode: lead.SENDER_PINCODE,
        'Country ISO': lead.SENDER_COUNTRY_ISO,
        'Alt Mobile': lead.SENDER_MOBILE_ALT,
        Phone: lead.SENDER_PHONE,
        'Alt Phone': lead.SENDER_PHONE_ALT,
        'Alt Email': lead.SENDER_EMAIL_ALT,
        'Product Name': lead.QUERY_PRODUCT_NAME,
        Message: lead.QUERY_MESSAGE,
        'MCAT Name': lead.QUERY_MCAT_NAME,
        'Call Duration': lead.CALL_DURATION,
        'Receiver Mobile': lead.RECEIVER_MOBILE
      }));

      // Generate Excel file
      const worksheet = utils.json_to_sheet(formattedData);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, 'Leads Data');

      // Trigger the file download
      writeFile(workbook, 'LeadsData.xlsx');
    } catch (error) {
      console.error('Error exporting leads data to Excel:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>All Leads</h1>
      <Grid container spacing={3} style={{ marginBottom: '20px' }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div">
                Total Leads
              </Typography>
              <Typography variant="h4" component="div">
                {leads.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div">
                Following Leads
              </Typography>
              <Typography variant="h4" component="div">
                {followingLeads.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <div style={{ marginBottom: '20px' }}>
        <TextField
          type="date"
          label="Select Date"
          value={selectedDate}
          onChange={handleDateChange}
          InputLabelProps={{ shrink: true }}
          style={{ marginRight: '10px' }}
        />
        <FormControl style={{ marginRight: '10px', minWidth: 120 }}>
          <InputLabel>Month</InputLabel>
          <Select value={selectedMonth} onChange={handleMonthChange} label="Month">
            <MenuItem value="">None</MenuItem>
            {/* Generate options for the current year */}
            {Array.from({ length: 12 }).map((_, i) => (
              <MenuItem key={i} value={`${new Date().getFullYear()}-${i + 1}`}>
                {`${new Date(0, i).toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {selectedDate ||
          (selectedMonth && (
            <Button
              variant="contained"
              color={selectedDate || selectedMonth ? 'secondary' : 'primary'}
              onClick={() => {
                if (selectedDate || selectedMonth) {
                  // Reset date and month selections
                  setSelectedDate('');
                  setSelectedMonth('');
                  // Reset the filtered leads to show all leads
                  setFilteredLeads(leads);
                } else {
                  // You can leave this empty or handle other filter-related functionality here
                  // The filtering happens automatically when a date or month is selected
                }
              }}
            >
              {selectedDate || selectedMonth ? 'Cancel' : 'Filter'}
            </Button>
          ))}

        <Button
          variant="contained"
          color="secondary"
          onClick={exportToExcel}
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Exporting...' : 'Export Excel'}
        </Button>
      </div>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>S.No</TableCell>
                  <TableCell>Unique Query ID</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Mobile Number</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>Product Name</TableCell>
                  {/* Add more headers as needed */}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLeads.length > 0 ? (
                  filteredLeads.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((lead, index) => (
                    <TableRow key={lead.UNIQUE_QUERY_ID}>
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>{lead.UNIQUE_QUERY_ID}</TableCell>
                      <TableCell>{formatDate(lead.QUERY_TIME)}</TableCell>
                      <TableCell>{lead.SENDER_NAME}</TableCell>
                      <TableCell>{lead.SENDER_MOBILE}</TableCell>
                      <TableCell>{lead.SENDER_EMAIL}</TableCell>
                      <TableCell>{lead.SENDER_COMPANY}</TableCell>
                      <TableCell>{lead.SENDER_ADDRESS}</TableCell>
                      <TableCell>{lead.SENDER_CITY}</TableCell>
                      <TableCell>{lead.SENDER_STATE}</TableCell>
                      <TableCell>{lead.QUERY_PRODUCT_NAME}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11}>No data available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={filteredLeads.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}
    </div>
  );
};

export default LeadsList;
