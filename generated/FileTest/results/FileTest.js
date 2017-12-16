const fs = require('fs');

class TestClass {
  testMethod() {
    const file_content = fs.readFileSync("../../input/test.txt", 'utf-8');
    return file_content;
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}