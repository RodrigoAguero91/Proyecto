import { Router } from "express";
import UserModel from "../models/user.model.js";

const router = Router();

router.put('/premium/:uid', async (req, res) => {
    const uid = req.params.uid;
    const { role } = req.body;

   
    if (role !== 'usuario' && role !== 'premium') {
        return res.status(400).json({ error: 'Rol no válido' });
    }

    try {
        const user = await UserModel.findOne({ _id: uid });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        if (user.status === 'active') {
            
            user.role = role;
            await user.save();
            return res.status(200).json(user);
        } else {
            return res.status(400).json({ error: 'El usuario no tiene un estado activo.' });
        }

        
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/:uid/documents', async (req, res) => {
    const uid = req.params.uid;
    const { originalname, filename } = req.files;


    try {
        const uploadedDocuments = req.files.map(file => {
            const nameWithoutExtension = file.originalname.split('.').slice(0, -1).join('.');
            return {
                name: nameWithoutExtension,
                reference: file.filename
            };
        });

        const user = await UserModel.findOne({ _id: uid });
        if (user) {
            
            user.documents.push(...uploadedDocuments);
            await user.save();

            
            const requiredDocuments = ["Identificacion", "Comprobante de domicilio", "Comprobante de estado de cuenta"];
            const documentNames = await user.documents.map(doc => doc.name);
            const documentsMatched = requiredDocuments.every(doc => documentNames.includes(doc));

            if (documentsMatched) {
                user.status = 'active';
                await user.save();
            }
        }

        res.status(200).json({ message: 'Documentos cargados exitosamente.' });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;