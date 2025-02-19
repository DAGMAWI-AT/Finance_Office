const { pool } = require('../config/db');

const createBeneficiaryTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS beneficiaries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      beneficiary_id VARCHAR(255) NULL UNIQUE,
      fullName VARCHAR(255) NOT NULL,
      phone VARCHAR(15) NOT NULL,
      email VARCHAR(255) NULL,
      kebele VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      wereda VARCHAR(255) NOT NULL,
      kfleketema VARCHAR(255) NOT NULL,
      houseNo VARCHAR(255) NOT NULL,
      gender ENUM('male', 'female') NOT NULL DEFAULT 'male',
      age VARCHAR(255) NOT NULL,
      school VARCHAR(255) DEFAULT NULL,
      idFile VARCHAR(255) DEFAULT NULL,
      photo VARCHAR(255) NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await pool.execute(query);
    // console.log('Beneficiary table created or already exists');
  } catch (error) {
    console.error('Error creating beneficiary table:', error);
  }
};

module.exports = { createBeneficiaryTable, BeneficiaryTable: "beneficiaries" };