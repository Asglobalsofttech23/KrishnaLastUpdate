import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Button,
  Paper,
  Snackbar,
  Alert,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Typography
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import config from '../../../config';
import logo from '../../../images/Krishna Industries.jpeg';
import QuotationBackGround from '../../../images/QuotationBackground.png';
import { Text } from 'recharts';
import { format } from 'date-fns';

const QuotationPage = () => {
  const { follow_id } = useParams();
  const pdfRef = useRef(); // Reference to the PDF content
  const [openDialog, setOpenDialog] = useState(false); // Dialog state for PDF preview

  const fromDetails = {
    company: 'Krishna Industry',
    phone: '9876542488',
    email: 'email@example.com',
    address: '1/3/94 Peelamadu, Coimbatore, 624603',
    gst: '24797329433'
  };
  const [existing, setExisting] = useState({});
  const [toDetails, setToDetails] = useState({});
  const [quotationNumber, setQuotationNumber] = useState('');
  const [quotationDate, setQuotationDate] = useState('');
  const [products, setProducts] = useState([{ pro_id: '', quantity: '', price: '' }]);
  const [allProducts, setAllProducts] = useState([]);
  const [discount, setDiscount] = useState({ type: 'percentage', value: '' });
  const [gst, setGst] = useState('');
  const [subTotal, setSubTotal] = useState(0);
  const [totalWithoutTax, setTotalWithoutTax] = useState(0);
  const [success, setSuccess] = useState();
  const [totalWithTax, setTotalWithTax] = useState(0);
  const [PaidAmount, setPaidAmount] = useState(0);
  const [previousPaidAmount, setPreviousPaidAmount] = useState(0);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  // Snackbar states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const formattedDate = quotationDate ? format(new Date(quotationDate), 'dd/MM/yyyy') : ''; // Format the date
  // Fetch "To" details based on follow_id

  const fetchQuotationdatas = () => {
    if (follow_id) {
      setLoading(true);
      axios
        .get(`${config.apiUrl}/quotation/quotation/${follow_id}`)
        .then((res) => {
          setToDetails(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching lead data:', err);
          setSnackbarMessage('Failed to fetch lead details');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    fetchQuotationdatas();
  }, [follow_id, success]);

  useEffect(() => {
    if (toDetails.leads_id) {
      axios
        .get(`${config.apiUrl}/quotation/quotation/leads/${toDetails.leads_id}`)
        .then((res) => {
          setProducts(res.data.product_details);
          setQuotationDate(res.data.quotation_date);
          setQuotationNumber(res.data.quotation_number);
          setTotalWithTax(res.data.total_with_tax);
          setTotalWithoutTax(res.data.total_without_tax);
          setPreviousPaidAmount(parseFloat(res.data.paidAmount).toFixed(2)); // Store existing paid amount as decimal
          setPaidAmount(0); // Reset for new payments
          setBalance(parseFloat(res.data.balance));
          setGst(res.data.gst);
          setDiscount({
            type: res.data.discountType,
            value: res.data.discount
          });
        })
        .catch((err) => {
          console.error('Error fetching products:', err);
        });
    }
  }, [toDetails.leads_id, success]);

  // Fetch all products for selection
  useEffect(() => {
    axios
      .get(`${config.apiUrl}/product/getProductData`) // Adjust endpoint as needed
      .then((res) => {
        setAllProducts(res.data);
      })
      .catch((err) => {
        console.error('Error fetching products:', err);
        setSnackbarMessage('Failed to fetch products');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      });
  }, [follow_id, success]);

  const handleProductChange = (index, value) => {
    const selectedProduct = allProducts.find((product) => product.pro_name === value);
    const newProducts = [...products];

    // Only update the product id and price if a new product is selected
    if (selectedProduct) {
      newProducts[index].pro_id = selectedProduct.pro_id; // Set product ID
      newProducts[index].price = selectedProduct.price; // Set price from selected product
    } else {
      // If product is removed or invalid, clear the price
      newProducts[index].pro_id = '';
      newProducts[index].price = '';
    }

    setProducts(newProducts);
  };

  const handleQuantityChange = (index, value) => {
    const newProducts = [...products];
    newProducts[index].quantity = value;
    setProducts(newProducts);
  };

  const handlePriceChange = (index, value) => {
    const newProducts = [...products];
    newProducts[index].price = value;
    setProducts(newProducts);
  };

  const handleRemoveProduct = (index) => {
    const newProducts = products.filter((_, i) => i !== index);
    setProducts(newProducts);
  };

  const calculateTotal = (paidAmount = PaidAmount) => {
    let total = products.reduce((acc, product) => {
      const total = (parseFloat(product.price) || 0) * (parseInt(product.quantity) || 0);
      return acc + total;
    }, 0);
    setSubTotal(total);

    if (discount.type === 'percentage') {
      total -= (total * (parseFloat(discount.value) || 0)) / 100;
    } else {
      total -= parseFloat(discount.value) || 0;
    }

    const totalWithTax = total + (total * (parseFloat(gst) || 0)) / 100;
    setTotalWithoutTax(total.toFixed(2)); // Ensure 2 decimal places
    setTotalWithTax(totalWithTax.toFixed(2)); // Ensure 2 decimal places

    // Calculate balance: totalWithTax minus sum of previous and new payments
    const totalPaidAmount = (parseFloat(previousPaidAmount) || 0) + (parseFloat(paidAmount) || 0);
    const balanceAmount = totalWithTax - totalPaidAmount;
    setBalance(balanceAmount.toFixed(2)); // Ensure 2 decimal places
  };

  useEffect(() => {
    calculateTotal();
  }, [products, PaidAmount, discount, gst]);

  const handleAddProduct = () => {
    setProducts([...products, { pro_id: '', quantity: '', price: '' }]);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleSubmitQuotation = () => {
    if (!products.length) {
      setSnackbarMessage('Please add at least one product.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    const totalPaidAmount = (parseFloat(previousPaidAmount) || 0) + (parseFloat(PaidAmount) || 0);

    const quotationData = {
      leads_id: toDetails.leads_id,
      leads_name: toDetails.leads_name,
      leads_mobile: toDetails.leads_mobile,
      leads_email: toDetails.leads_email,
      product_details: products,
      total_without_tax: totalWithoutTax,
      total_with_tax: totalWithTax,
      discount: discount.value,
      discountType: discount.type,
      gst: gst,
      paidAmount: totalPaidAmount,
      balance: balance
    };

    setLoading(true);
    axios
      .post(`${config.apiUrl}/quotation/quotations`, quotationData)
      .then((response) => {
        const { quotation_number, quotation_date } = response.data;

        setQuotationNumber(quotation_number);
        setQuotationDate(quotation_date);
        setSnackbarMessage('Quotation created successfully.');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setLoading(false);

        // Open dialog for PDF preview after successful submission
        setOpenDialog(true);
        setSuccess('success');
        fetchQuotationdatas();
      })
      .catch((error) => {
        setSnackbarMessage('Error submitting quotation.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setLoading(false);
      });
  };

  // Generate PDF
  const handleGeneratePDF = () => {
    const doc = new jsPDF();

    // Define heights for header and footer
    const headerHeight = 20;
    const footerHeight = 15;

    // Convert the content in pdfRef to canvas
    html2canvas(pdfRef.current, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');

      // Header Section
      doc.setFillColor(0, 0, 139); // Dark blue color
      doc.rect(0, 0, doc.internal.pageSize.width, headerHeight, 'F'); // Draw filled rectangle for header
      doc.setTextColor(255, 255, 255); // Set text color to white
      doc.setFontSize(12); // Set font size for header
      doc.setFont('Helvetica', 'bold');
      doc.text('Quotation Document', doc.internal.pageSize.width / 2, 10, { align: 'center', baseline: 'middle' }); // Centered header text

      // Add the canvas image to the PDF below the header
      doc.addImage(imgData, 'PNG', 10, headerHeight + 5, 190, 0); // Add image with padding from the header

      // Footer Section
      const pageHeight = doc.internal.pageSize.height; // Get page height
      doc.setFillColor(0, 0, 139); // Dark blue color for footer
      doc.rect(0, pageHeight - footerHeight, doc.internal.pageSize.width, footerHeight, 'F'); // Draw filled rectangle for footer
      doc.setTextColor(255, 255, 255); // Set text color to white for footer
      doc.setFontSize(10); // Set font size for footer
      doc.text('© 2024 Krishna Industry | All rights reserved', doc.internal.pageSize.width / 2, pageHeight - 5, {
        align: 'center',
        baseline: 'middle'
      }); // Centered footer text

      // Save the generated PDF
      doc.save(`Quotation-${quotationNumber}.pdf`);
    });
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  return (
    <div>
      <Typography variant="h1" align="center" justifyContent="center" marginBottom="20px">
        Quotation
      </Typography>
      <Grid container spacing={3} alignItems="flex-start" justifyContent="space-between">
        {/* From Details */}
        <Grid item xs={6}>
          <Typography variant="h2" marginBottom={'10px'}>
            From
          </Typography>
          <Typography variant="h3">{fromDetails.company}</Typography>
          <Typography variant="h5">Phone: {fromDetails.phone}</Typography>
          <Typography variant="h5">Email: {fromDetails.email}</Typography>
          <Typography variant="h5">Address: {fromDetails.address}</Typography>
          <Typography variant="h5">GST NO: {fromDetails.gst}</Typography>
        </Grid>

        {/* To Details */}
        <Grid item xs={6} style={{ textAlign: 'left', marginLeft: '0px' }}>
          {loading ? (
            <CircularProgress />
          ) : (
            <>
              <Typography variant="h2" marginBottom={'10px'}>
                To
              </Typography>
              <Typography variant="h3">{toDetails.leads_name}</Typography>
              <Typography variant="h5">Company: {toDetails.leads_company}</Typography>
              <Typography variant="h5">Phone: {toDetails.leads_mobile}</Typography>
              <Typography variant="h5">Email: {toDetails.leads_email}</Typography>
              <Typography variant="h5">GST No :{toDetails.gst_number}</Typography>
            </>
          )}
        </Grid>
      </Grid>

      {/* To Details */}
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          {/* Billing and Shipping Address */}
          <Grid container spacing={3} marginTop={'2px'}>
            <Grid item xs={12} sm={6}>
              <h3>Billing Address</h3>
              <Typography variant="h6">
                {toDetails.billing_door_number || 'N/A'}, {toDetails.billing_street || 'N/A'}, <br />
                {toDetails.billing_landMark || 'N/A'}, <br />
                {toDetails.billing_city || 'N/A'},<br /> {toDetails.billing_state || 'N/A'} - {toDetails.billing_pincode || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} marginBottom="10px">
              <h3>Shipping Address</h3>
              <Typography variant="h6">
                {toDetails.shipping_door_number || 'N/A'}, {toDetails.shipping_street || 'N/A'},<br />{' '}
                {toDetails.shipping_landMark || 'N/A'}, <br />
                {toDetails.shipping_city || 'N/A'},<br /> {toDetails.shipping_state || 'N/A'} - {toDetails.shipping_pincode || 'N/A'}
              </Typography>
              {/* <p>{existing.quotation_number || 'na'}</p> */}
            </Grid>
          </Grid>

          {/* Product Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product, index) => {
                  const matchingProduct = allProducts.find((p) => p.pro_id === product.pro_id);
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Autocomplete
                          options={allProducts.map((product) => product.pro_name)}
                          renderInput={(params) => <TextField {...params} label="Product" />}
                          onChange={(event, value) => handleProductChange(index, value)}
                          value={matchingProduct ? matchingProduct.pro_name : ''}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          label="Quantity"
                          value={product.quantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          inputProps={{ min: 0 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          label="Price"
                          value={product.price}
                          onChange={(e) => handlePriceChange(index, e.target.value)}
                          inputProps={{ min: 0 }}
                        />
                      </TableCell>
                      <TableCell>{parseFloat(product.price) * parseInt(product.quantity) || 0}</TableCell>
                      <TableCell>
                        <Button color="secondary" onClick={() => handleRemoveProduct(index)}>
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableCell colSpan={5} align="right">
                <Typography variant="h4">Sub Total: {subTotal}</Typography>
              </TableCell>
            </Table>
            <Button style={{ margin: '20px' }} onClick={handleAddProduct}>
              Add Product
            </Button>
          </TableContainer>

          {/* Discount and GST */}
          <Grid container spacing={3} margin={'2px'}>
            <Grid item xs={6} sm={3}>
              <TextField
                select
                label="Discount Type"
                value={discount.type}
                onChange={(e) => setDiscount({ ...discount, type: e.target.value })}
                fullWidth
              >
                <MenuItem value="percentage">Percentage</MenuItem>
                <MenuItem value="Amount"> Amount</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                label="Discount"
                type="number"
                value={discount.value}
                onChange={(e) => setDiscount({ ...discount, value: e.target.value })}
                fullWidth
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12} sm={2}>
              <TextField label="GST" type="number" value={gst} onChange={(e) => setGst(e.target.value)} fullWidth />
            </Grid>
          </Grid>

          <Grid container spacing={3} margin={'2px'}>
            <Grid item xs={12} sm={2}>
              <TextField label="Total" type="number" value={totalWithTax} fullWidth inputProps={{ readOnly: true, min: 0 }} />
            </Grid>
            {previousPaidAmount > 0 && (
              <Grid item xs={12} sm={2}>
                <TextField label="advance" type="number" value={previousPaidAmount} fullWidth inputProps={{ readOnly: true, min: 0 }} />
              </Grid>
            )}

            <Grid item xs={6} sm={3}>
              <TextField
                label="Paid Amount"
                type="number"
                // If the value is 0 and the input is focused, we show an empty string; otherwise, show the actual value
                value={PaidAmount === 0 ? '' : PaidAmount}
                onChange={(e) => {
                  const newPaidAmount = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                  setPaidAmount(newPaidAmount);
                  calculateTotal(newPaidAmount); // Calculate balance based on both old and new payments
                }}
                fullWidth
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12} sm={2}>
              <TextField label="Balance" type="number" value={balance} fullWidth inputProps={{ readOnly: true, min: 0 }} />
            </Grid>
          </Grid>

          {/* Totals */}
          <Grid item xs={6} sm={3} margin={'15px'} marginTop={'20px'}>
            <Grid container direction="column">
              <Grid item container justifyContent="space-between">
                <Typography variant="h6" style={{ flex: 0.3 }}>
                  Total (without tax)
                </Typography>
                <Typography variant="h6" style={{ textAlign: 'left', flex: 1 }}>
                  {totalWithoutTax}
                </Typography>
              </Grid>
              <Grid item container justifyContent="space-between">
                <Typography variant="h6" style={{ flex: 0.3 }}>
                  Discount
                </Typography>
                <Typography variant="h6" style={{ textAlign: 'left', flex: 1 }}>
                  {discount.type === 'percentage' ? `${discount.value}%` : `₹${discount.value}`}
                </Typography>
              </Grid>
              <Grid item container justifyContent="space-between">
                <Typography variant="h6" style={{ flex: 0.3 }}>
                  GST
                </Typography>
                <Typography variant="h6" style={{ textAlign: 'left', flex: 1 }}>
                  {gst}%
                </Typography>
              </Grid>
              <Grid item container justifyContent="space-between">
                <Typography variant="h6" style={{ flex: 0.3 }}>
                  Total (with tax)
                </Typography>
                <Typography variant="h6" style={{ textAlign: 'left', flex: 1 }}>
                  {totalWithTax}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={30}>
            {/* Submit Button */}
            <Button onClick={handleSubmitQuotation} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Submit Quotation'}
            </Button>
            <Button onClick={() => setOpenDialog(true)} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Preview'}
            </Button>
          </Grid>

          {/* PDF Preview Dialog */}
          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
            <DialogTitle>Quotation Preview</DialogTitle>
            <DialogContent dividers color="red">
              <div
                ref={pdfRef}
                style={{
                  padding: '10px',
                  backgroundColor: '#ffffff',
                  backgroundImage: '', // Optional background image
                  backgroundSize: 'cover',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  // border: '2px solid #ddd',
                  // boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px'
                }}
              >
                <Grid container alignItems="center" justifyContent="space-between">
                  {/* Logo on the left */}
                  <Grid item xs={3}>
                    <img src={logo} alt="Company Logo" style={{ width: '120px', height: 'auto' }} />
                  </Grid>

                  {/* Quotation number and date on the right */}
                  <Grid item xs={6} style={{ textAlign: 'right' }}>
                    <Typography variant="h6">Quotation No: {quotationNumber}</Typography>
                    <Typography>Date: {formattedDate}</Typography> {/* Using formattedDate for dd/mm/yyyy format */}
                  </Grid>
                </Grid>
                {/* Company Logo */}
                <Grid container alignItems="center" justifyContent="space-between" spacing={2}>
                  {/* From Section */}
                  <Grid item xs={6} style={{ textAlign: 'left' }}>
                    <Typography variant="h3" marginTop="15px" gutterBottom>
                      From
                    </Typography>

                    <Typography variant="h3">{fromDetails.company}</Typography>
                    <Typography variant="h6">Phone: {fromDetails.phone}</Typography>
                    <Typography variant="h6">Email: {fromDetails.email}</Typography>
                    <Typography variant="h6">Address: {fromDetails.address}</Typography>
                    <Typography variant="h6">GST NO: {fromDetails.gst}</Typography>
                  </Grid>

                  {/* To Section */}
                  <Grid item xs={6} style={{ textAlign: 'left' }}>
                    <Typography variant="h3" marginTop="15px" gutterBottom>
                      To
                    </Typography>
                    <Typography variant="h3">{toDetails.leads_name}</Typography>
                    <Typography variant="h5">Company: {toDetails.leads_company}</Typography>
                    <Typography variant="h6">Phone: {toDetails.leads_mobile}</Typography>
                    <Typography variant="h6">Email: {toDetails.leads_email}</Typography>
                    <Typography variant="h6">GST No :{toDetails.gst_number}</Typography>
                  </Grid>
                </Grid>
                <Grid container spacing={3} style={{ borderWidth: '2px', borderColor: 'black', paddingTop: '15px' }}>
                  {/* Billing Address */}

                  <Grid item xs={6}>
                    <Typography variant="h4">Billing Address</Typography>
                    <Typography variant="h6">
                      {toDetails.billing_door_number || 'N/A'},<br /> {toDetails.billing_street || 'N/A'},{' '}
                      {toDetails.billing_landMark || 'N/A'}, <br />
                      {toDetails.billing_city || 'N/A'},<br /> {toDetails.billing_state || 'N/A'} - {toDetails.billing_pincode || 'N/A'}
                    </Typography>
                  </Grid>

                  {/* Shipping Address */}
                  <Grid item xs={6}>
                    <Typography variant="h4">Shipping Address</Typography>

                    <Typography variant="h6">
                      {toDetails.billing_door_number || 'N/A'}, <br />
                      {toDetails.billing_street || 'N/A'}, {toDetails.billing_landMark || 'N/A'}, <br />
                      {toDetails.billing_city || 'N/A'}, <br />
                      {toDetails.billing_state || 'N/A'} - {toDetails.billing_pincode || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
                {/* Quotation Title and Details */}
                {/* Product Details Table */}
                <TableContainer style={{ marginTop: '20px' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Sub Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {products.map((product, index) => {
                        // Find the matching product by pro_id
                        const matchedProduct = allProducts.find((p) => p.pro_id === product.pro_id);

                        return (
                          <TableRow key={index}>
                            <TableCell>{matchedProduct ? matchedProduct.pro_name : 'Unknown Product'}</TableCell>
                            <TableCell>{product.quantity}</TableCell>
                            <TableCell>{product.price}</TableCell>
                            <TableCell>{parseFloat(product.price) * parseInt(product.quantity)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    <TableCell colSpan={4} align="right">
                      <Typography variant="h4">Sub Total: {subTotal}</Typography>
                    </TableCell>
                  </Table>
                </TableContainer>

                <Grid item xs={6} sm={3} margin={'15px'} marginTop={'20px'}>
                  <Typography variant="h4" align="right" margin={'3px'}>
                    Totals Section
                  </Typography>
                  <Grid container direction="column">
                    <Grid item container justifyContent="space-between">
                      <Typography variant="h6" style={{ textAlign: 'right', flex: 1 }}>
                        Discount
                      </Typography>
                      <Typography variant="h6" style={{ textAlign: 'right', flex: 0.1 }}>
                        {discount.type === 'percentage' ? `${discount.value}%` : `₹${discount.value}`}
                      </Typography>
                    </Grid>
                    <Grid item container justifyContent="space-between">
                      <Typography variant="h6" style={{ textAlign: 'right', flex: 1 }}>
                        Total (without tax)
                      </Typography>
                      <Typography variant="h6" style={{ textAlign: 'right', flex: 0.1 }}>
                        {totalWithoutTax}
                      </Typography>
                    </Grid>

                    <Grid item container justifyContent="space-between">
                      <Typography variant="h6" style={{ textAlign: 'right', flex: 1 }}>
                        GST
                      </Typography>
                      <Typography variant="h6" style={{ textAlign: 'right', flex: 0.1 }}>
                        {gst}%
                      </Typography>
                    </Grid>
                    <Grid item container justifyContent="space-between">
                      <Typography variant="h4" style={{ textAlign: 'right', flex: 1 }}>
                        Total (with tax)
                      </Typography>
                      <Typography variant="h4" style={{ textAlign: 'right', flex: 0.1 }}>
                        {totalWithTax}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </div>
            </DialogContent>

            {/* Actions for Download */}
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
              <Button onClick={handleGeneratePDF}>Download PDF</Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar for feedback */}
          <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={handleSnackbarClose}>
            <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </>
      )}
    </div>
  );
};

export default QuotationPage;
