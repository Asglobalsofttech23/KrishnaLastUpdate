const express = require('express');
const moment = require('moment');

const router = express.Router();

module.exports = (db) => {
    // Function to generate a new quotation number
    const generateQuotationNumber = (callback) => {
        const prefix = 'KRI';
        db.query('SELECT COUNT(*) as count FROM QuotationHistory', (err, result) => {
            if (err) {
                return callback(err);
            }
            const count = result[0].count + 1; // Increment count
            const quotationNumber = `${prefix}${count.toString().padStart(5, '0')}`; // KRI00001, KRI00002, etc.
            callback(null, quotationNumber);
        });
    };

    // Route to create or update a quotation
    router.post('/quotations', (req, res) => {
        console.log("Saving or updating quotation");

        const { leads_id, leads_name, leads_mobile, leads_email, product_details, total_without_tax, total_with_tax, paidAmount, balance, discount, gst, discountType } = req.body;

        // Check if a quotation already exists for this lead
        db.query('SELECT * FROM QuotationHistory WHERE leads_id = ?', [leads_id], (err, existingInvoice) => {
            if (err) {
                console.error("Error fetching quotation:", err);
                return res.status(500).json({ message: "Internal server error." });
            }

            // If a quotation exists, update it
            if (existingInvoice.length > 0) {
                const quotation_id = existingInvoice[0].quotation_number;
                // console.log(quotation_id);

                const updateQuery = `
                    UPDATE QuotationHistory 
                    SET leads_name = ?, leads_mobile = ?, leads_email = ?, product_details = ?, total_without_tax = ?, total_with_tax = ?,paidAmount = ? ,balance = ?, discount = ?, gst = ?,discountType = ?,updated_at = ?
                    WHERE quotation_number = ?
                `;
                const updatedAt = moment().format('YYYY-MM-DD');
                const params = [leads_name, leads_mobile, leads_email, JSON.stringify(product_details), total_without_tax, total_with_tax, paidAmount, balance, discount, gst, discountType, updatedAt, quotation_id];
                console.log(discountType);

                db.query(updateQuery, params, (err, result) => {
                    if (err) {
                        console.error("Error updating quotation:", err);
                        return res.status(500).json({ message: "Internal server error." });
                    }
                    res.status(200).json({ message: "Quotation updated successfully.", quotation_id });
                });
            } else {
                // Generate new quotation number and insert new quotation
                generateQuotationNumber((err, quotation_number) => {
                    if (err) {
                        console.error("Error generating quotation number:", err);
                        return res.status(500).json({ message: "Internal server error." });
                    }

                    const quotation_date = moment().format('YYYY-MM-DD');

                    const insertQuery = `
                        INSERT INTO QuotationHistory (quotation_number, leads_id, leads_name, leads_mobile, leads_email, product_details, total_without_tax, total_with_tax, paidAmount,balance, discount,gst,discountType, quotation_date)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?, ?, ?,?,?)
                    `;

                    const params = [quotation_number, leads_id, leads_name, leads_mobile, leads_email, JSON.stringify(product_details), total_without_tax, total_with_tax, paidAmount, balance, discount, gst, discountType, quotation_date];

                    db.query(insertQuery, params, (err, result) => {
                        if (err) {
                            console.error("Error inserting quotation data:", err);
                            return res.status(500).json({ message: "Internal server error." });
                        }

                        // Return the quotation number and date on success
                        res.status(201).json({ message: "Quotation created successfully.", quotation_number, quotation_date });
                    });
                });
            }
        });
    });

    // Route to get lead details and associated quotation
    router.get('/quotation/:follow_id', async (req, res) => {
        console.log("Fetching lead and quotation details");

        const { follow_id } = req.params;

        const query = `
        SELECT 
          follow_id, emp_id, leads_id, leads_name, leads_mobile, leads_email, product_name,
          leads_company, leads_address, leads_state, leads_city, Call_Discussion, remember, 
          reminder_date, Description, call_Attended, created_at, updated_at, gst_number,
          billing_door_number, billing_street, billing_landMark, billing_city, billing_state, 
          billing_pincode, shipping_door_number, shipping_street, shipping_landMark, shipping_city,
          shipping_state, shipping_pincode
        FROM following_leads 
        WHERE follow_id = ?
      `;

        db.query(query, [follow_id], (err, results) => {
            if (err) {
                console.error('Error fetching lead by follow_id: ', err);
                return res.status(500).json({ message: "Internal server error" });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: "Lead not found" });
            }

            const leadData = results[0];

            // Combine billing and shipping addresses into objects
            leadData.billing_address = {
                door_number: leadData.billing_door_number,
                street: leadData.billing_street,
                landMark: leadData.billing_landMark,
                city: leadData.billing_city,
                state: leadData.billing_state,
                pincode: leadData.billing_pincode
            };

            leadData.shipping_address = {
                door_number: leadData.shipping_door_number,
                street: leadData.shipping_street,
                landMark: leadData.shipping_landMark,
                city: leadData.shipping_city,
                state: leadData.shipping_state,
                pincode: leadData.shipping_pincode
            };

            // Fetch any associated quotation for the lead
            db.query('SELECT * FROM QuotationHistory WHERE leads_id = ?', [leadData.leads_id], (err, quotationResult) => {
                if (err) {
                    console.error("Error fetching quotation:", err);
                    return res.status(500).json({ message: "Internal server error" });
                }

                leadData.quotation = quotationResult.length > 0 ? quotationResult[0] : null;

                // Return the lead data with all fields, including address objects and associated quotation
                res.status(200).json(leadData);
            });
        });
    });
    // Route to get a quotation based on leads_id
    router.get('/quotation/leads/:leads_id', async (req, res) => {
        const { leads_id } = req.params;
        console.log(`leadsid ${leads_id}`);


        const query = `
        SELECT 
            quotation_number, leads_id, leads_name, leads_mobile, leads_email, product_details,
            total_without_tax, total_with_tax, paidAmount,balance,discount,gst,discountType, quotation_date
        FROM QuotationHistory
        WHERE leads_id = ?
    `;

        db.query(query, [leads_id], (err, results) => {
            if (err) {
                console.error('Error fetching quotation by leads_id: ', err);
                return res.status(500).json({ message: "Internal server error" });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: "No quotation found for the given lead" });
            }

            const quotationData = results[0];
            res.status(200).json(quotationData);
        });
    });

    const generateInvoiceNumber = (callback) => {
        const prefix = 'KRINV';
        db.query('SELECT COUNT(*) as count FROM invoicehistory', (err, result) => {
            if (err) {
                return callback(err);
            }
            const count = result[0].count + 1; // Increment count
            const invoiceNumber = `${prefix}${count.toString().padStart(5, '0')}`; // KRI00001, KRI00002, etc.
            callback(null, invoiceNumber);
        });
    };





    router.post('/invoices', (req, res) => {
        console.log("Saving new or updating existing invoice");

        const { invoice_number, leads_id, leads_name, leads_mobile, leads_email, product_details, total_without_tax, total_with_tax, paidAmount, balance, discount, gst, discountType, payment_type, transactionId } = req.body;

        // If an invoice_number is provided, update the existing invoice
        if (invoice_number) {
            console.log(invoice_number);

            const updateQuery = `
                UPDATE invoicehistory
                SET leads_id = ?, leads_name = ?, leads_mobile = ?, leads_email = ?, product_details = ?, total_without_tax = ?, total_with_tax = ?, paidAmount = ?, balance = ?, discount = ?, gst = ?, discountType = ?, payment_type = ?, transactionId = ?, updated_at = NOW()
                WHERE invoice_number = ?
            `;
            const updateParams = [leads_id, leads_name, leads_mobile, leads_email, JSON.stringify(product_details), total_without_tax, total_with_tax, paidAmount, balance, discount, gst, discountType, payment_type, transactionId, invoice_number];

            db.query(updateQuery, updateParams, (err, result) => {
                if (err) {
                    console.error("Error updating invoice data:", err);
                    return res.status(500).json({ message: "Internal server error." });
                }

                console.log("Invoice updated:", invoice_number);
                return res.status(201).json({ message: "Invoice updated successfully", invoice_number });
            });
        } else {
            // Generate a new invoice number and insert new invoice
            generateInvoiceNumber((err, invoice_number) => {
                if (err) {
                    console.error("Error generating invoice number:", err);
                    return res.status(500).json({ message: "Internal server error." });
                }

                const invoice_date = moment().format('YYYY-MM-DD');

                const insertQuery = `
                INSERT INTO invoicehistory (invoice_number, leads_id, leads_name, leads_mobile, leads_email, product_details, total_without_tax, total_with_tax,paidAmount,balance, discount, gst, discountType, payment_type, transactionId, invoice_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?, ?, ?, ?, ?, ?, ?)
                `;

                const params = [invoice_number, leads_id, leads_name, leads_mobile, leads_email, JSON.stringify(product_details), total_without_tax, total_with_tax, paidAmount, balance, discount, gst, discountType, payment_type, transactionId, invoice_date];

                db.query(insertQuery, params, (err, result) => {
                    if (err) {
                        console.error("Error inserting invoice data:", err);
                        return res.status(500).json({ message: "Internal server error." });
                    }

                    // Check if the customer already exists in the Customer table
                    const checkCustomerQuery = `SELECT * FROM Customer WHERE leads_id = ?`;

                    db.query(checkCustomerQuery, [leads_id], (err, customerResult) => {
                        if (err) {
                            console.error("Error checking customer:", err);
                            return res.status(500).json({ message: "Internal server error." });
                        }

                        // If the customer exists, update; otherwise, insert
                        const query = customerResult.length > 0
                            ? `
                                UPDATE Customer AS c
                                JOIN following_leads AS fl ON c.leads_id = fl.leads_id
                                SET
                                    c.follow_id = fl.follow_id,
                                    c.emp_id = fl.emp_id,
                                    c.leads_name = fl.leads_name,
                                    c.leads_mobile = fl.leads_mobile,
                                    c.leads_email = fl.leads_email,
                                    c.product_name = fl.product_name,
                                    c.leads_company = fl.leads_company,
                                    c.leads_address = fl.leads_address,
                                    c.leads_state = fl.leads_state,
                                    c.leads_city = fl.leads_city,
                                    c.Call_Discussion = fl.Call_Discussion,
                                    c.remember = fl.remember,
                                    c.reminder_date = fl.reminder_date,
                                    c.Description = fl.Description,
                                    c.call_Attended = fl.call_Attended,
                                    c.created_at = NOW(),
        c.updated_at = NOW(),
                                    c.gst_number = fl.gst_number,
                                    c.billing_door_number = fl.billing_door_number,
                                    c.billing_street = fl.billing_street,
                                    c.billing_landMark = fl.billing_landMark,
                                    c.billing_city = fl.billing_city,
                                    c.billing_state = fl.billing_state,
                                    c.billing_pincode = fl.billing_pincode,
                                    c.shipping_door_number = fl.shipping_door_number,
                                    c.shipping_street = fl.shipping_street,
                                    c.shipping_landMark = fl.shipping_landMark,
                                    c.shipping_city = fl.shipping_city,
                                    c.shipping_state = fl.shipping_state,
                                    c.shipping_pincode = fl.shipping_pincode
                                WHERE c.leads_id = ?
                            `
                            : `
                                INSERT INTO Customer (follow_id,emp_id, leads_id, leads_name, leads_mobile, leads_email, product_name, leads_company, leads_address, leads_state, leads_city, Call_Discussion, remember, reminder_date, Description, call_Attended, created_at, updated_at, gst_number, billing_door_number, billing_street, billing_landMark, billing_city, billing_state, billing_pincode, shipping_door_number, shipping_street, shipping_landMark, shipping_city, shipping_state, shipping_pincode)
                                SELECT  follow_id, emp_id, leads_id, leads_name, leads_mobile, leads_email, product_name, leads_company, leads_address, leads_state, leads_city, Call_Discussion, remember, reminder_date, Description, call_Attended, NOW(), NOW(), gst_number, billing_door_number, billing_street, billing_landMark, billing_city, billing_state, billing_pincode, shipping_door_number, shipping_street, shipping_landMark, shipping_city, shipping_state, shipping_pincode
                                FROM following_leads
                                WHERE leads_id = ?
                            `;

                        // If the customer exists, update; otherwise, insert
                        const params = [leads_id];

                        db.query(query, params, (err, result) => {
                            if (err) {
                                console.error("Error copying/updating customer data:", err);
                                return res.status(500).json({ message: "Internal server error." });
                            }

                            // Return the invoice number and date on success
                            res.status(201).json({ message: "Invoice created and customer data updated/copied successfully.", invoice_number, invoice_date, payment_type, transactionId });
                            console.log(invoice_number, invoice_date, payment_type, transactionId);
                        });
                    });
                });
            });
        }
    });




    router.get('/invoice/leads/:leads_id', async (req, res) => {

        const { leads_id } = req.params;
        console.log(`Fetching data for leads_id: ${leads_id}`);

        // SQL query to fetch data from QuotationHistory and InvoiceHistory using a LEFT JOIN
        const query = `
                SELECT 
                    q.quotation_number, q.leads_id, q.leads_name, q.leads_mobile, q.leads_email, q.product_details,
                    q.total_without_tax, q.total_with_tax,q.paidAmount,q.balance, q.discount, q.gst, q.discountType, q.quotation_date,
                    i.invoice_number, i.invoice_date, i.payment_type, i.transactionId
                FROM QuotationHistory q
                LEFT JOIN invoicehistory i ON q.leads_id = i.leads_id
                WHERE q.leads_id = ?
            `;

        try {
            // Execute the query
            db.query(query, [leads_id], (err, results) => {
                if (err) {
                    console.error('Error fetching data by leads_id: ', err);
                    return res.status(500).json({ message: "Internal server error" });
                }

                // If no results, return 404
                if (results.length === 0) {
                    return res.status(404).json({ message: "No quotation or invoice found for the given lead" });
                }

                // Send the combined result back to the client
                res.status(200).json(results[0]); // Return the first result (assuming one entry per lead)
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    });



    router.get('/invoicelist/:leads_id', async (req, res) => {
        const { leads_id } = req.params;
        console.log(`Fetching data for leads_id: ${leads_id}`);

        // Correct SQL query syntax
        const query = `SELECT * FROM invoicehistory WHERE leads_id = ?`; // Fixed the query by adding '*'

        try {
            // Execute the query
            db.query(query, [leads_id], (err, results) => {
                if (err) {
                    console.error('Error fetching data by leads_id: ', err);
                    return res.status(500).json({ message: "Internal server error" });
                }

                // If no results, return 404
                if (results.length === 0) {
                    return res.status(201).json({ message: "No invoice found for the given lead" });
                }

                // Send the combined result back to the client
                res.status(200).json(results); // Return all results
            });
        } catch (error) {
            console.error('Unexpected error: ', error);
            res.status(500).json({ message: "Internal server error" });
        }
    });


    // Controller function to get invoice data
    router.get('/invoiceHistory/:emp_id', async (req, res) => {
        const { emp_id } = req.params; // Assuming emp_id is passed as a route parameter
        console.log(`Employee ID: ${emp_id}`);

        const query = `
            SELECT 
                fl.follow_id,
                fl.emp_id,
                fl.leads_id AS leads_id,
                fl.leads_company,
                fl.product_name AS product_name,
                fl.remember,
                fl.reminder_date,
                fl.Description,
                fl.call_Attended,
                fl.created_at AS created_at,
                fl.updated_at AS updated_at,
                fl.gst_number,
                fl.billing_door_number,
                fl.billing_street,
                fl.billing_landMark,
                fl.billing_city AS billing_city,
                fl.billing_state AS billing_state,
                fl.billing_pincode AS billing_pincode,
                fl.shipping_door_number,
                fl.shipping_street,
                fl.shipping_landMark,
                fl.shipping_city AS shipping_city,
                fl.shipping_state AS shipping_state,
                fl.shipping_pincode AS shipping_pincode,
                ih.id AS invoice_id,
                ih.invoice_number,
                ih.leads_name AS leads_name,
                ih.leads_mobile AS leads_mobile,
                ih.leads_email AS leads_email,
                ih.product_details,
                ih.discount,
                ih.gst,
                ih.total_without_tax,
                ih.total_with_tax,
                ih.payment_type,
                ih.invoice_date,
                ih.created_at AS invoice_created_at,
                ih.updated_at AS invoice_updated_at,
                ih.discountType,
                ih.transactionId
            FROM 
                following_leads fl
            LEFT JOIN 
                invoicehistory ih ON fl.leads_id = ih.leads_id
            WHERE 
                fl.emp_id = ? AND ih.id IS NOT NULL
        `;

        db.query(query, [emp_id], (err, results) => {
            if (err) {
                console.error('Error fetching lead and invoice data: ', err);
                return res.status(500).json({ message: "Internal server error" });
            }

            // If no results, return an empty array instead of an error
            if (results.length === 0) {
                return res.status(200).json([]); // Return empty array if no data is found
            }

            const leadAndInvoiceData = results; // Structure this data as needed
            res.status(200).json(leadAndInvoiceData);
        });
    });


    // Controller function to get invoice data
    router.get('/invoiceHistory', async (req, res) => {
        const query = `
             SELECT 
                fl.follow_id,
                fl.emp_id,
                fl.leads_id AS leads_id,
                fl.leads_company,
                fl.product_name AS product_name,
                fl.remember,
                fl.reminder_date,
                fl.Description,
                fl.call_Attended,
                fl.created_at AS created_at,
                fl.updated_at AS updated_at,
                fl.gst_number,
                fl.billing_door_number,
                fl.billing_street,
                fl.billing_landMark,
                fl.billing_city AS billing_city,
                fl.billing_state AS billing_state,
                fl.billing_pincode AS billing_pincode,
                fl.shipping_door_number,
                fl.shipping_street,
                fl.shipping_landMark,
                fl.shipping_city AS shipping_city,
                fl.shipping_state AS shipping_state,
                fl.shipping_pincode AS shipping_pincode,
                ih.id AS invoice_id,
                ih.invoice_number,
                ih.leads_name AS leads_name,
                ih.leads_mobile AS leads_mobile,
                ih.leads_email AS leads_email,
                ih.product_details,
                ih.discount,
                ih.gst,
                ih.total_without_tax,
                ih.total_with_tax,
                ih.payment_type,
                ih.invoice_date,
                ih.created_at AS invoice_created_at,
                ih.updated_at AS invoice_updated_at,
                ih.discountType,
                ih.transactionId
            FROM 
                following_leads fl
            LEFT JOIN 
                invoicehistory ih ON fl.leads_id = ih.leads_id
            WHERE 
            ih.id IS NOT NULL
        `;

        db.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching lead and invoice data: ', err);
                return res.status(500).json({ message: "Internal server error" });
            }

            // Log the query results to see if data is fetched
            // console.log('Query results:', results);

            // If no results, return an empty array instead of an error
            if (results.length === 0) {
                console.log('No data found'); // Log for debugging
                return res.status(200).json([]); // Return empty array if no data is found
            }

            const leadAndInvoiceData = results;
            res.status(200).json(leadAndInvoiceData);
        });
    });

    router.get('/empDashBoard/:emp_id', async (req, res) => {
        const { emp_id } = req.params;
        const today = moment().format('YYYY-MM-DD');
        console.log(`Employee ID: ${emp_id}`);

        const query = `
            SELECT
                -- Count of distinct leads followed today
                (SELECT COUNT(DISTINCT fl.leads_id)
                 FROM following_leads AS fl
                 WHERE fl.emp_id = ? AND DATE(fl.created_at) = ?) AS leads_followed_today,
    
                -- Concatenated list of followed leads' names today
                (SELECT GROUP_CONCAT(DISTINCT fl.leads_name SEPARATOR ', ')
                 FROM following_leads AS fl
                 WHERE fl.emp_id = ? AND DATE(fl.created_at) = ?) AS leads_names_today,
    
                -- Total sales value for today
                (SELECT IFNULL(SUM(ih.total_with_tax), 0)
                 FROM invoicehistory AS ih
                 JOIN customer AS c ON ih.leads_id = c.leads_id
                 WHERE c.emp_id = ? AND DATE(ih.invoice_date) = ?) AS total_sales_value_today,
    
                -- Count of invoices created today
                (SELECT COUNT(DISTINCT ih.invoice_number)
                 FROM invoicehistory AS ih
                 JOIN customer AS c ON ih.leads_id = c.leads_id
                 WHERE c.emp_id = ? AND DATE(ih.invoice_date) = ?) AS invoice_count_today,
    
                -- Concatenated list of invoice lead names for today
                (SELECT GROUP_CONCAT(DISTINCT c.leads_name SEPARATOR ', ')
                 FROM invoicehistory AS ih
                 JOIN customer AS c ON ih.leads_id = c.leads_id
                 WHERE c.emp_id = ? AND DATE(ih.invoice_date) = ?) AS invoice_lead_names_today,
    
                -- Invoice numbers and prices for today
                (SELECT GROUP_CONCAT(CONCAT(ih.invoice_number, ' (Price: ₹', ih.total_with_tax, ')') SEPARATOR ', ')
                 FROM invoicehistory AS ih
                 JOIN customer AS c ON ih.leads_id = c.leads_id
                 WHERE c.emp_id = ? AND DATE(ih.invoice_date) = ?) AS invoice_details_today
        `;

        db.query(query, [emp_id, today, emp_id, today, emp_id, today, emp_id, today, emp_id, today, emp_id, today], (err, results) => {
            if (err) {
                console.error('Error fetching dashboard data: ', err);
                return res.status(500).json({ message: "Internal server error" });
            }

            if (results.length === 0) {
                return res.status(200).json({
                    leads_followed_today: 0,
                    leads_names_today: '',
                    total_sales_value_today: 0,
                    invoice_count_today: 0,
                    invoice_lead_names_today: '',
                    invoice_details_today: '' // Include this line for the response
                });
            }

            const dashboardData = results[0];
            res.status(200).json(dashboardData);
        });
    });


    router.get('/customers-transactions', (req, res) => {
        const query = `
            SELECT 
                c.leads_name,
                c.leads_id,
                SUM(ih.total_with_tax) AS total_with_tax_sum,
                SUM(ih.paidAmount) AS paidAmount_sum,
                SUM(ih.balance) AS balance_sum
            FROM 
                customer AS c
            LEFT JOIN 
                invoicehistory AS ih
            ON 
                c.leads_id = ih.leads_id
            GROUP BY 
                c.leads_id, c.leads_name;
        `;

        db.query(query, (error, results) => {
            if (error) {
                return res.status(500).json({ error: 'Error fetching customer transaction details' });
            }

            res.status(200).json(results);
        });
    });

    router.get('/financial-data', (req, res) => {
        const salesQuery = 'SELECT SUM(total_with_tax) AS totalSales FROM invoicehistory';
        const purchasesQuery = 'SELECT SUM(totalPriceWithGST) AS totalPurchases FROM purchases';

        db.query(salesQuery, (err, salesResults) => {
            if (err) {
                console.error('Error fetching sales data:', err);
                return res.status(500).json({ error: 'Error fetching sales data' });
            }

            const totalSales = salesResults[0]?.totalSales || 0;

            db.query(purchasesQuery, (err, purchaseResults) => {
                if (err) {
                    console.error('Error fetching purchase data:', err);
                    return res.status(500).json({ error: 'Error fetching purchase data' });
                }

                const totalPurchases = purchaseResults[0]?.totalPurchases || 0;
                const profit = totalSales - totalPurchases;

                res.json({
                    totalSales,
                    totalPurchases,
                    profit
                });
            });
        });
    });

    return router;
};
