const { pool } = require('../config/db');

const createBeneficiaryTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS beneficiaries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fullName VARCHAR(255) NOT NULL,
      phone VARCHAR(15) NOT NULL,
      email VARCHAR(255) NOT NULL,
      kebele VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      wereda VARCHAR(255) NOT NULL,
      kfleketema VARCHAR(255) NOT NULL,
      houseNo VARCHAR(255) NOT NULL,
      idFile VARCHAR(255) NOT NULL,
      photo VARCHAR(255) NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await pool.execute(query);
    console.log('Beneficiary table created or already exists');
  } catch (error) {
    console.error('Error creating beneficiary table:', error);
  }
};

module.exports = { createBeneficiaryTable, BeneficiaryTable: "beneficiaries" };