import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixMissingCategories() {
  try {
    // Read current organization categories
    const currentCategoriesPath = path.join(__dirname, 'data', 'organization-categories.json');
    let currentCategories = [];
    
    if (fs.existsSync(currentCategoriesPath)) {
      const data = fs.readFileSync(currentCategoriesPath, 'utf8');
      currentCategories = JSON.parse(data);
    }
    
    console.log(`Current categories count: ${currentCategories.length}`);
    
    // Read Excel file
    const filePath = path.join(__dirname, 'attached_assets', '대학_조직_카테고리_목록_1750812699347.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const excelData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Excel data count: ${excelData.length}`);
    
    // Find current max ID
    let maxId = 0;
    currentCategories.forEach(cat => {
      if (cat.id > maxId) maxId = cat.id;
    });
    
    console.log(`Current max ID: ${maxId}`);
    
    // Process Excel data and create missing categories
    const newCategories = [];
    let nextId = maxId + 1;
    
    excelData.forEach((row, index) => {
      const upperCategory = row['상위카테고리']?.toString()?.trim();
      const lowerCategory = row['하위카테고리']?.toString()?.trim();
      const detailCategory = row['세부카테고리']?.toString()?.trim();
      const status = row['상태']?.toString()?.trim() || '활성';
      
      if (upperCategory && lowerCategory && detailCategory) {
        // Check if this exact combination already exists
        const exists = currentCategories.find(cat => 
          cat.upperCategory === upperCategory &&
          cat.lowerCategory === lowerCategory &&
          cat.detailCategory === detailCategory
        );
        
        if (!exists) {
          const newCategory = {
            id: nextId++,
            name: detailCategory,
            upperCategory: upperCategory,
            lowerCategory: lowerCategory,
            detailCategory: detailCategory,
            description: `세부 조직 (${status})`,
            isActive: status === '활성',
            status: status,
            manager: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          newCategories.push(newCategory);
          console.log(`Adding missing category: ${upperCategory} > ${lowerCategory} > ${detailCategory}`);
        }
      }
    });
    
    console.log(`New categories to add: ${newCategories.length}`);
    
    if (newCategories.length > 0) {
      // Merge with existing categories
      const allCategories = [...currentCategories, ...newCategories];
      
      // Save updated categories
      fs.writeFileSync(currentCategoriesPath, JSON.stringify(allCategories, null, 2));
      console.log(`✅ Successfully added ${newCategories.length} missing categories`);
      console.log(`📊 Total categories now: ${allCategories.length}`);
      
      // List unique upper categories after fix
      const upperCategories = [...new Set(allCategories.map(cat => cat.upperCategory))].sort();
      console.log('\n📋 All upper categories after fix:');
      upperCategories.forEach(cat => {
        console.log(`- ${cat}`);
      });
      
    } else {
      console.log('✅ No missing categories found - all data is already synchronized');
    }
    
  } catch (error) {
    console.error('❌ Error fixing missing categories:', error);
  }
}

fixMissingCategories();