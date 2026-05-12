import * as XLSX from 'xlsx';
import type { Student } from '../types';
// Using crypto.randomUUID() or a simple ID generator instead.

export const parseStudentsFile = async (file: File): Promise<Student[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        const students: Student[] = [];
        
        jsonData.forEach((row, index) => {
          // Try to find appropriate keys
          const keys = Object.keys(row);
          const nameKey = keys.find(k => 
            k.toLowerCase().includes('nome') || 
            k.toLowerCase().includes('name') || 
            k.toLowerCase().includes('estudante') ||
            k.toLowerCase().includes('aluno')
          );
          const regKey = keys.find(k => 
            k.toLowerCase().includes('matr') || 
            k.toLowerCase().includes('id') || 
            k.toLowerCase().includes('código') ||
            k.toLowerCase().includes('ra')
          );
          
          // Fallback to first and second columns if specific names aren't found
          const name = nameKey ? row[nameKey] : (row[keys[1]] || row[keys[0]]);
          const registration = regKey ? row[regKey] : (row[keys[0]] || String(index + 1));
          
          if (name) {
            students.push({
              id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
              name: String(name).trim(),
              registration: String(registration).trim()
            });
          }
        });
        
        resolve(students);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};
