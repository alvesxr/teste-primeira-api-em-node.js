import express from 'express'; // "type": "module" deve estar no package.json
import mysql from 'mysql2'; // Importando o mysql2 da pasta node_modules
import cors from 'cors'; // Importando o cors para permitir requisições de diferentes origens

// AVISO e dicas para agilizar o desenvolvimento:
// 1. Use "npm init -y" para criar o arquivo package.json rapidamente.
// 2. Use "npm install express mysql2 --save" para instalar as dependências necessárias.
// 3. Use "npm install -g nodemon" para instalar o nodemon globalmente (opcional).
// 4. Sempre inicie o servidor com "npx nodemon server.js" para que ele reinicie automaticamente ao salvar alterações.
// 5. Para rodar o servidor manualmente, use "node server.js".
// instalar o cors comando: npm install cors

// Inicializa o app com express
const app = express();
app.use(cors()); // Permite requisições de diferentes origens
app.use(express.json()); // Middleware para interpretar JSON

// Criando a conexão com o banco de dados
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'testenodeapi',
});

// Testando a conexão com o banco de dados
connection.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao MySQL:', err.message);
    } else {
        console.log('Conexão com MySQL bem-sucedida!');
    }
});

// Rota POST para inserir usuários no banco de dados
app.post('/usuarios', (req, res) => {
    const { name, email, age } = req.body;

    // Verifica se todos os campos necessários foram enviados
    if (!name || !email || !age) {
        return res.status(400).json({ error: 'Todos os campos (name, email, age) são obrigatórios.' });
    }

    // Verifica se o e-mail já existe no banco
    connection.query(
        'SELECT * FROM user WHERE email = ?',
        [email],
        (error, results) => {
            if (error) {
                console.error('Erro ao verificar e-mail:', error);
                return res.status(500).json({ error: 'Erro ao verificar e-mail' });
            }

            if (results.length > 0) {
                return res.status(400).json({ error: 'E-mail já está em uso' });
            }

            // Insere o novo usuário no banco
            connection.query(
                'INSERT INTO user (name, email, age) VALUES (?, ?, ?)',
                [name, email, age],
                (insertError, insertResults) => {
                    if (insertError) {
                        console.error('Erro ao inserir dados:', insertError);
                        return res.status(500).json({ error: 'Erro ao inserir dados' });
                    }

                    console.log('Usuário criado com sucesso:', insertResults);
                    res.status(201).json({ message: 'Usuário criado com sucesso' });
                }
            );
        }
    );
});

// Rota GET para listar usuários com possibilidade de filtros
app.get('/usuarios', (req, res) => {
    const { name, email, age } = req.query; // Obtém os filtros da query string

    // Base da query SQL
    let query = 'SELECT * FROM user';
    const filters = [];
    const values = [];

    // Adiciona filtros dinamicamente
    if (name) {
        filters.push('name = ?');
        values.push(name);
    }
    if (email) {
        filters.push('email = ?');
        values.push(email);
    }
    if (age) {
        filters.push('age = ?');
        values.push(age);
    }

    // Se houver filtros, adiciona a cláusula WHERE
    if (filters.length > 0) {
        query += ' WHERE ' + filters.join(' AND ');
    }

    // Executa a query
    connection.query(query, values, (error, results) => {
        if (error) {
            console.error('Erro ao buscar dados:', error);
            return res.status(500).json({ error: 'Erro ao buscar dados' });
        }

        res.status(200).json(results);
    });
});

// Rota PUT para atualizar usuários
// Atualiza os dados de um usuário específico com base no ID
// O ID do usuário é passado como parâmetro na URL
app.put('/usuarios/:id_user', (req, res) => {
    const { id_user } = req.params; // Obtém o ID do usuário a partir dos parâmetros da URL
    const { name, email, age } = req.body; // Obtém os dados do corpo da requisição

    // Verifica se todos os campos necessários foram enviados
    if (!name || !email || !age) {
        return res.status(400).json({ error: 'Todos os campos (name, email, age) são obrigatórios.' });
    }

    // Verifica se o e-mail já está em uso por outro usuário
    connection.query(
        'SELECT * FROM user WHERE email = ? AND id_user != ?',
        [email, id_user],
        (error, results) => {
            if (error) {
                console.error('Erro ao verificar e-mail:', error);
                return res.status(500).json({ error: 'Erro ao verificar e-mail' });
            }

            if (results.length > 0) {
                return res.status(400).json({ error: 'E-mail já está em uso por outro usuário' });
            }

            // Atualiza os dados do usuário
            connection.query(
                'UPDATE user SET name = ?, email = ?, age = ? WHERE id_user = ?',
                [name, email, age, id_user],
                (updateError, updateResults) => {
                    if (updateError) {
                        console.error('Erro ao atualizar dados:', updateError);
                        return res.status(500).json({ error: 'Erro ao atualizar dados' });
                    }

                    // Verifica se algum registro foi afetado
                    if (updateResults.affectedRows === 0) {
                        return res.status(404).json({ error: 'Usuário não encontrado' });
                    }

                    console.log('Dados atualizados com sucesso:', updateResults); // Log do resultado
                    res.status(200).json({ message: 'Dados atualizados com sucesso' });
                }
            );
        }
    );
});

// Rota DELETE para deletar usuários
app.delete('/usuarios/:id_user', (req, res) => {
    const { id_user } = req.params; // Obtém o ID do usuário a partir dos parâmetros da URL

    // Query para deletar o usuário do banco
    connection.query(
        'DELETE FROM user WHERE id_user = ?', // Deleta o usuário
        [id_user], // Passa o ID do usuário para a query
        (error, results) => {
            if (error) {
                console.error('Erro ao deletar dados:', error); // Log do erro
                return res.status(500).json({ error: 'Erro ao deletar dados' });
            }

            // Verifica se algum registro foi afetado
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            console.log('Usuário deletado com sucesso:', results); // Log do resultado
            res.status(200).json({ message: 'Usuário deletado com sucesso' });
        }
    );
});

// Iniciando o servidor na porta 3300
app.listen(3300, () => {
    console.log('Servidor rodando na porta 3300');
});