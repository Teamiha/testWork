// Function for processing data from CSV and converting to JSON
function processJsonData(userContext, events, done) {
  try {
    // Get string values from CSV
    const itemsStr = userContext.vars.items;
    const lengthStr = userContext.vars.length;
    
    // Parse JSON array string into JavaScript array
    const parsedItems = JSON.parse(itemsStr);
    
    // Convert string length value to number
    const parsedLength = parseInt(lengthStr, 10);
    
    // Save processed values in context
    userContext.vars.parsedItems = parsedItems;
    userContext.vars.parsedLength = parsedLength;
    
    // For debugging
    // console.log(`Processed: items=${JSON.stringify(parsedItems)}, length=${parsedLength}`);
    
    return done();
  } catch (error) {
    console.error('Error processing CSV data:', error);
    return done(error);
  }
}

module.exports = {
  processJsonData
}; 