//Este script atualiza a descrição do curso engenharia de telecomunicações e a duração dos cursos na base de dados da tua máquina.
UPDATE public.cursos_academicos
SET 
    descricao = CASE 
        WHEN id = 1 THEN 'Curso académico de engenharia orientado para redes de telecomunicações, comunicação de dados e infraestruturas de conectividade.' 
        ELSE descricao 
    END,
    duracao = CASE 
        WHEN id = 1 THEN '5 anos'
        WHEN id = 2 THEN '5 anos'
        ELSE duracao 
    END
WHERE id IN (1, 2);

