const initTables = async () => {
  try {
    const connection = await mysqlPool.getConnection();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pricing_plans (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        category VARCHAR(255),
        tagline VARCHAR(255),
        priceDisplay VARCHAR(100),
        priceVal DECIMAL(10,2),
        period VARCHAR(100),
        description TEXT,
        features JSON,
        cta VARCHAR(255),
        isPopular BOOLEAN,
        accent VARCHAR(100),
        detailedCurriculum JSON,
        sort_order INT
      )
    `);
    connection.release();
    console.log("MySQL Tables initialized.");
  } catch (e) {
    console.error("Error initializing tables:", e);
  }
};
