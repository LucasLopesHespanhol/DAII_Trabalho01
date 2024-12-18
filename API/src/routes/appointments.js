const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Conectar ao MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/bc', { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.on('connected', () => {
  console.log('MongoDB appointments conectado');
});

// Schema e modelo para "appointments"
const appointmentsSchema = new mongoose.Schema({
  specialty: { type: String, required: true },
  comments: { type: String, required: false },
  date: { type: Date, required: true },
  student: { type: String, required: true },
  professional: { type: String, required: true }
});

const Appointment = mongoose.model('Appointment', appointmentsSchema);

// Função para validar ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ** Rotas para os compromissos **

router.get('/date', async (req, res) => {
  try {
      const { startDate, endDate } = req.query;

      const appointments = await Appointment.find({
          date: {
              $gte: new Date(startDate),
              $lte: new Date(endDate), // Inclui até o final do dia
          },
      });

      res.status(200).json({ foundAppointments: appointments });
  } catch (err) {
      res.status(500).json({ message: "Erro ao buscar compromissos.", error: err.message });
  }
});


// Retornar todos os compromissos
// GET "/appointments"
router.get('/', async (req, res) => {
  try {
    const appointments = await Appointment.find();
    res.status(200).json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar compromissos', error: err.message });
  }
});

// Retornar compromissos por aluno
// GET "/appointments/student?student=<nome_do_aluno>"
router.get('/student', async (req, res) => {
  const { student } = req.query;

  if (!student) {
    return res.status(400).json({ message: 'Por favor, forneça o nome do aluno.' });
  }

  try {
    // Usando regex com opção 'i' para busca case-insensitive
    const appointments = await Appointment.find({
      student: { $regex: student, $options: 'i' } // Busca mais flexível
    });
    res.status(200).json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar compromissos por aluno', error: err.message });
  }
});

// Retornar um compromisso específico pelo ID
// GET "/appointments/:id"
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }

  try {
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Compromisso não encontrado!' });
    }
    res.status(200).json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar compromisso', error: err.message });
  }
});

// Inserir um novo compromisso
// POST "/appointments"
router.post('/', async (req, res) => {
  const { specialty, date, student, professional, comments } = req.body;

  // Validação de campos obrigatórios
  if (!specialty || !date || !student || !professional) {
      return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos!' });
  }

  try {
      const appointment = new Appointment({
          specialty,
          date: new Date(date), // Conversão de data para formato Date do JavaScript
          student,
          professional,
          comments
      });

      const newAppointment = await appointment.save();
      res.status(201).json({ message: 'Compromisso adicionado com sucesso!', newAppointment });
  } catch (err) {
      res.status(400).json({ message: 'Erro ao adicionar compromisso', error: err.message });
  }
});



// Atualizar dados de um compromisso
// PUT "/appointments/:id"
router.put('/:id', async (req, res) => {
  const { id } = req.params;

  // Verifica se o ID é válido
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }

  // Validação de campos obrigatórios
  const { specialty, date, student, professional } = req.body;
  if (!specialty || !date || !student || !professional) {
    return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos!' });
  }

  try {
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedAppointment) {
      return res.status(404).json({ message: 'Compromisso não encontrado!' });
    }
    res.status(200).json({ message: 'Compromisso atualizado com sucesso!', updatedAppointment });
  } catch (err) {
    res.status(400).json({ message: 'Erro ao atualizar compromisso', error: err.message });
  }
});

// Deletar um compromisso
// DELETE "/appointments/:id"
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  // Verifica se o ID é válido
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }

  try {
    const deletedAppointment = await Appointment.findByIdAndDelete(id);
    if (!deletedAppointment) {
      return res.status(404).json({ message: 'Compromisso não encontrado!' });
    }
    res.status(200).json({ message: 'Compromisso deletado com sucesso!', deletedAppointment });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao deletar compromisso', error: err.message });
  }
});

module.exports = router;