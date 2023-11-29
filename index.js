import express from 'express';
import pg from 'pg';
import 'dotenv/config';

// Σύνδεση σε Διακομιστή (Connect to Server)
const app = express();
const port = 3000;

// Σύνδεση σε Βάση Δεδομένων (Connect to Database)
const db = new pg.Client({
  user: 'postgres',
  host: 'localhost',
  database: 'users',
  password: process.env.DATABASE_PASSWORD,
  port: 5432,
});

db.connect();

// Αρχικές Τιμές (Initial Values)
let booksRead = [];

// Δεδομένα (Data)


// Λειτουργίες (Functions)
const getReadBooks = async (res, req, next) => {
  const δεδομένα = await db.query(
    'SELECT id, author, title, rating, place, date from books JOIN books_read ON books.id = book_id'
  );
  booksRead = δεδομένα.rows;
  next();
};

const αντικατάστασηΦωνηέντων = (text) => {
  return text.replace('Ά', 'Α').replace('Έ', 'Ε').replace('Ή', 'Η').replace('Ί', 'Ι').replace('Ό', 'Ο').replace('Ύ', 'Υ').replace('Ώ', 'Ω')
}


// Ενδιάμεσες Λειτουργίες (Middleware)
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(getReadBooks);

// GET
app.get('/', (req, res) => {
  res.render('index.ejs', { booksRead });
});

app.get('/admin', (req, res) => {
  res.render('index-admin.ejs', { booksRead });
});

app.get('/register', (req, res) => {
  res.render('index.ejs');
});

app.get('/login', (req, res) => {
  res.render('index.ejs');
});

// POST
app.post('/login', (req, res) => {
  res.render('index.ejs');
});

app.post('/book', async (req, res) => {
  const τΒιβλίου = req.body.bookID;
  const δεδομένα = await db.query(
    `SELECT id, author, title, rating, place, date, notes from books JOIN books_read ON books.id = book_id`
  );
  const book = δεδομένα.rows.find((β) => β.id == τΒιβλίου);
  
  res.render('book-page.ejs', { book });
});

app.post('/admin/book', async (req, res) => {
  const τΒιβλίου = req.body.bookID;
  const δεδομένα = await db.query(
    `SELECT id, user_id, book_id, author, title, rating, place, date, notes from books JOIN books_read ON books.id = book_id`
  );
  const book = δεδομένα.rows.find((β) => β.id == τΒιβλίου);
  
  res.render('book-page-admin.ejs', { book });
});

app.post('/add', async (req, res) => {
  const τΧρήστη = 1
  const τίτλος = αντικατάστασηΦωνηέντων(req.body.title.toUpperCase());
  const συγγραφέας = req.body.author;
  const έτοςΣυγγραφής = parseInt(req.body.writtenYear1) || parseInt(req.body.writtenYear2)
  const έτοςΑνάγνωσης = parseInt(req.body.readYear);
  const τοποθεσία = req.body.place;
  const βαθμολογία = parseInt(req.body.rating);
  const σημειώσεις = req.body.notes;
  const αναγνωσμένο = req.body.read;
  
  
  const id = await db.query(
    `INSERT INTO books (title, author, age) VALUES ('${τίτλος}', '${συγγραφέας}', ${έτοςΣυγγραφής}) RETURNING id`
    );
  const τΒιβλίου = id.rows[0].id
  

  if (αναγνωσμένο === 'checked') {
    await db.query(
      `INSERT INTO books_read (user_id, book_id, place, rating, date, notes) VALUES (${τΧρήστη}, ${τΒιβλίου}, '${τοποθεσία}', ${βαθμολογία}, ${έτοςΑνάγνωσης}, '${σημειώσεις}')`
    );
  }
  res.redirect('/admin');
});
 
// PUT

// PATCH
app.post('/admin/edit/:id', async (req, res) => {
  // const δΒιβλίου = parseInt(req.params.id);
  const τΧρήστη = parseInt(req.body.userID);
  const τΒιβλίου = parseInt(req.body.bookID);
  const βαθμολογία = parseInt(req.body.rating);
  const τοποθεσία = req.body.place;
  const ημερομηνία = parseInt(req.body.date);
  const σημειώσεις = req.body.notes;

  if (ημερομηνία) {
    await db.query(
      `UPDATE books_read SET rating = ${βαθμολογία}, place = '${τοποθεσία}', date=${ημερομηνία}, notes='${σημειώσεις}' WHERE (user_id, book_id) = (${τΧρήστη}, ${τΒιβλίου})`
    );
  } else {
    await db.query(
      `UPDATE books_read SET rating = ${βαθμολογία}, place = '${τοποθεσία}', notes='${σημειώσεις}' WHERE (user_id, book_id) = (${τΧρήστη}, ${τΒιβλίου})`
    );
  }

  const δεδομένα = await db.query(
    `SELECT id, user_id, book_id, author, title, rating, place, date, notes from books JOIN books_read ON books.id = book_id`
  );
  const book = δεδομένα.rows.find((β) => β.id == τΒιβλίου);
  res.render('book-page-admin.ejs', { book });
});

// DELETE
app.post('/admin/delete/:id', async (req, res) => {
  const δΒιβλίου = parseInt(req.params.id);
  const τΧρήστη = parseInt(req.body.userID);
  const τΒιβλίου = parseInt(req.body.bookID);


  await db.query(
    `DELETE FROM books_read WHERE user_id = ${τΧρήστη} AND book_id = ${τΒιβλίου}`
  );
  res.redirect('/admin');
});

// Πύλη Διακομιστή (Server Port)
app.listen(port, () => {
  console.log(
    `Διακομιστής: Ενεργός στην πύλη ${port} --> http://localhost:${port}`
  );
});
