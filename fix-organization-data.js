import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// Process the uploaded Excel file and extract only authentic organization data
async function processOrganizationFile() {
  try {
    // Find the most recent organization Excel file
    const excelFile = './attached_assets/대학_조직_카테고리_목록_1750812699347.xlsx';
    
    if (!fs.existsSync(excelFile)) {
      console.error('Organization Excel file not found');
      return;
    }

    console.log('Processing organization file:', excelFile);
    
    // Read the Excel file
    const workbook = XLSX.readFile(excelFile);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${data.length} rows in Excel file`);
    
    // Process and clean the data
    const organizations = [];
    let id = 1;
    
    data.forEach((row, index) => {
      // Handle different possible column names (Korean/English)
      const name = row['조직명'] || row['name'] || row['Name'] || '';
      const upperCategory = row['상위카테고리'] || row['상위조직'] || row['upperCategory'] || row['Upper Category'] || '';
      const lowerCategory = row['하위카테고리'] || row['하위조직'] || row['lowerCategory'] || row['Lower Category'] || '';
      const detailCategory = row['세부카테고리'] || row['세부조직'] || row['detailCategory'] || row['Detail Category'] || '';
      
      if (name && name.trim()) {
        const org = {
          id: id++,
          name: name.trim(),
          upperCategory: upperCategory && upperCategory.trim() ? upperCategory.trim() : null,
          lowerCategory: lowerCategory && lowerCategory.trim() ? lowerCategory.trim() : null,
          detailCategory: detailCategory && detailCategory.trim() ? detailCategory.trim() : null,
          description: `조직 (활성)`,
          isActive: true,
          status: '활성',
          manager: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        organizations.push(org);
        console.log(`${index + 1}. ${org.name} - ${org.upperCategory || 'None'} > ${org.lowerCategory || 'None'} > ${org.detailCategory || 'None'}`);
      }
    });
    
    console.log(`\nProcessed ${organizations.length} valid organizations`);
    
    // Save the clean data
    const outputFile = './data/organization-categories.json';
    
    // Ensure data directory exists
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data', { recursive: true });
    }
    
    fs.writeFileSync(outputFile, JSON.stringify(organizations, null, 2));
    console.log(`Saved ${organizations.length} organizations to ${outputFile}`);
    
    // Also create a summary
    const summary = {
      totalCount: organizations.length,
      byUpperCategory: {},
      byLowerCategory: {},
      byDetailCategory: {}
    };
    
    organizations.forEach(org => {
      if (org.upperCategory) {
        summary.byUpperCategory[org.upperCategory] = (summary.byUpperCategory[org.upperCategory] || 0) + 1;
      }
      if (org.lowerCategory) {
        summary.byLowerCategory[org.lowerCategory] = (summary.byLowerCategory[org.lowerCategory] || 0) + 1;
      }
      if (org.detailCategory) {
        summary.byDetailCategory[org.detailCategory] = (summary.byDetailCategory[org.detailCategory] || 0) + 1;
      }
    });
    
    console.log('\nSummary:');
    console.log('Total organizations:', summary.totalCount);
    console.log('Upper categories:', Object.keys(summary.byUpperCategory).length);
    console.log('Lower categories:', Object.keys(summary.byLowerCategory).length);
    console.log('Detail categories:', Object.keys(summary.byDetailCategory).length);
    
    return organizations;
    
  } catch (error) {
    console.error('Error processing organization file:', error);
  }
}

// Run the processing
processOrganizationFile();