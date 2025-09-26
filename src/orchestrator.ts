export async function main() {
  // Check in src/input/unsorted if there is anything to place in src/msg-processor/input and/or src/pst-processor/input
  // If there's none, simply warn log. Otherwise sort the file by their type extension and place .msg file in src/msg-processor/input folder and .pst in src/pst-processor/input folder
  // Then
  // Process first .pst files placed in src/pst-processor/input
  // Generate a JSON file with an array of object containing the necessary emails informations. in this folder src/pst-processor/output 
  // ### Object should look like this
  // {  
  //   "subject": "lorem ipsum"
  //   "messageId": "<84db9c2d3ffb4b3cb4fdca83178dc756@DAG15EX2.local>",
  //   "senderName": "Elodie HUET",
  //   "senderEmail": "ehuet@all-in-space.com",
  //   "body": "Bonjour, Je serai de retour au bureau le 8 janvier 2024. En cas d'urgence, vous pouvez joindre le standard d'ALL IN SPACE au 03.20.04.04.51. A bientôt Elodie HUET",
  //.  "sentAt": "12/03/2011 - 12h43"
  // }
  // 
  // Process first .msg files placed in src/msg-processor/input
  // Generate a JSON file with an array of object containing the necessary emails informations. in this folder src/msg-processor/output
  // ### Object should look like this
  // {  
  //   "subject": "lorem ipsum"
  //   "messageId": "<84db9c2d3ffb4b3cb4fdca83178dc756@DAG15EX2.local>",
  //   "senderName": "Elodie HUET",
  //   "senderEmail": "ehuet@all-in-space.com",
  //   "body": "Bonjour, Je serai de retour au bureau le 8 janvier 2024. En cas d'urgence, vous pouvez joindre le standard d'ALL IN SPACE au 03.20.04.04.51. A bientôt Elodie HUET",
  //.  "sentAt": "12/03/2011 - 12h43"
  // }
  // Then from each JSON in both output folder containing arrays of object, process the fields of object to extract contacts information such as email, full_name, mobile_phone, landline_phone, company, role, address with ollama llm.
  // (This could be place in a temporary folder during the process)
  // then convert the json array onto a CSV file
}
