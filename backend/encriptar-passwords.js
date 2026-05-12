const bcrypt = require('bcryptjs');
const pool = require('./config/db');

const encriptarPasswords = async () => {
    try {
        const result = await pool.query('SELECT id, password_hash FROM usuarios');
        
        for (const user of result.rows) {
            if (user.password_hash.length < 60) {
                const hashedPassword = await bcrypt.hash(user.password_hash, 10);
                await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [hashedPassword, user.id]);
                console.log(`✅ Usuario ${user.id} encriptado`);
            }
        }
        console.log('✅ Todas las contraseñas fueron encriptadas');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

encriptarPasswords();