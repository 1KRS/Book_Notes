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
let data = [];

// Δεδομένα (Data)

// Λειτουργίες (Functions)
const getReadBooks = async (res, req, next) => {
  const δεδομένα = await db.query(
    'SELECT first_name, book_id, author, title, rating, place, date from books_read JOIN books ON books.id = book_id JOIN users ON users.id = user_id'
  );
  data = δεδομένα.rows;
  next();
};

const αντικατάστασηΦωνηέντων = (text) => {
  return text
    .replace('Ά', 'Α')
    .replace('Έ', 'Ε')
    .replace('Ή', 'Η')
    .replace('Ί', 'Ι')
    .replace('Ό', 'Ο')
    .replace('Ύ', 'Υ')
    .replace('Ώ', 'Ω');
};

// Ενδιάμεσες Λειτουργίες (Middleware)
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(getReadBooks);

// GET
app.get('/', (req, res) => {
  res.render('index.ejs', { data });
});

app.get('/admin', (req, res) => {
  res.render('index-admin.ejs', { data });
});

app.get('/register', (req, res) => {
  res.render('index.ejs');
});

// POST
app.post('/login', async (req, res) => {
  const ηΤαχυδρομείο = req.body.email;
  const κωδικός = req.body.password;

  const δεδομένα = await db.query(
    `SELECT * from users WHERE email = '${ηΤαχυδρομείο}'`
  );
  const χρήστης = δεδομένα.rows[0];

  if (δεδομένα.rowCount !== 0) {
    if (χρήστης.password == κωδικός) {
      χρήστης.admin == true
        ? res.render('index-admin.ejs', { data })
        : res.render('index.ejs', { data });
    } else {
      console.error('Ο κωδικός που πληκτρολογήθηκε είναι λάθος');
    }
  } else {
    console.error('Ο χρήστης με αυτήν την διεύθυνση δεν υπάρχει');
  }
});

app.post('/book', async (req, res) => {
  const τΒιβλίου = req.body.bookID;
  const δεδομένα = await db.query(
    'SELECT first_name, user_id, book_id, author, title, rating, place, date, notes from books_read JOIN books ON books.id = book_id JOIN users ON users.id = user_id'
  );
  const data = δεδομένα.rows.find((β) => β.book_id == τΒιβλίου);

  res.render('book-page.ejs', { data });
});

app.post('/admin/book', async (req, res) => {
  const τΒιβλίου = req.body.bookID;
  const δεδομένα = await db.query(
    'SELECT first_name, user_id, book_id, author, title, rating, place, date, notes from books_read JOIN books ON books.id = book_id JOIN users ON users.id = user_id'
  );

  const data = δεδομένα.rows.find((β) => β.book_id == τΒιβλίου);
 
  res.render('book-page-admin.ejs', { data });
});

app.post('/add', async (req, res) => {
  const τΧρήστη = 1;
  const τίτλος = αντικατάστασηΦωνηέντων(req.body.title.toUpperCase());
  const συγγραφέας = req.body.author;
  const έτοςΣυγγραφής =
    parseInt(req.body.writtenYear1) || parseInt(req.body.writtenYear2);
  const έτοςΑνάγνωσης = parseInt(req.body.readYear);
  const τοποθεσία = req.body.place;
  const βαθμολογία = parseInt(req.body.rating);
  const σημειώσεις = req.body.notes;
  const αναγνωσμένο = req.body.read;

  const id = await db.query(
    `INSERT INTO books (title, author, age) VALUES ('${τίτλος}', '${συγγραφέας}', ${έτοςΣυγγραφής}) RETURNING id`
  );
  const τΒιβλίου = id.rows[0].id;

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
  const ημερομηνία = req.body.date;
  const σημειώσεις = req.body.notes;

    console.log('Αλλαγή', τΧρήστη, τΒιβλίου, βαθμολογία, τοποθεσία, ημερομηνία, σημειώσεις);


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
    'SELECT first_name, user_id, book_id, author, title, rating, place, date, notes from books_read JOIN books ON books.id = book_id JOIN users ON users.id = user_id'
  );

  const data = δεδομένα.rows.find((β) => β.book_id == τΒιβλίου);

  res.render('book-page-admin.ejs', { data });
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
