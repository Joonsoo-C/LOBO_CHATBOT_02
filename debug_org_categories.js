import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugOrganizationCategories() {
  try {
    const filePath = path.join(__dirname, 'attached_assets', '대학_조직_카테고리_목록_1750812699347.xlsx');
    console.log('Reading Excel file:', filePath);
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${data.length} rows in Excel file`);
    console.log('First 5 rows:');
    data.slice(0, 5).forEach((row, i) => {
      console.log(`Row ${i + 1}:`, row);
    });
    
    // Extract unique upper categories
    const upperCategories = new Set();
    data.forEach(row => {
      const upperCategory = row['상위카테고리'] || row['상위조직'] || row['upperCategory'];
      if (upperCategory && upperCategory.trim()) {
        upperCategories.add(upperCategory.trim());
      }
    });
    
    console.log('\nUnique upper categories found in Excel:');
    Array.from(upperCategories).sort().forEach(cat => {
      console.log(`- ${cat}`);
    });
    
    // Check for '대학본부' specifically
    const hasDaehakBonbu = Array.from(upperCategories).some(cat => 
      cat.includes('대학본부') || cat.includes('본부')
    );
    
    console.log(`\n'대학본부' found in Excel: ${hasDaehakBonbu}`);
    
    if (hasDaehakBonbu) {
      console.log('Finding rows with 대학본부:');
      data.forEach((row, i) => {
        const upperCategory = row['상위카테고리'] || row['상위조직'] || row['upperCategory'];
        if (upperCategory && (upperCategory.includes('대학본부') || upperCategory.includes('본부'))) {
          console.log(`Row ${i + 1}:`, row);
        }
      });
    }
    
  } catch (error) {
    console.error('Error reading Excel file:', error);
  }
}

debugOrganizationCategories();