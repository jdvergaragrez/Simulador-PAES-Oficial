// Agrupa categorías DEMRE que son la misma carrera con distinto nombre (plan común,
// "con mención", "civil en X" vs "civil X", sede en el nombre…) bajo una categoría genérica.
// No fusiona Ingeniería Civil X con Ingeniería en X (ejecución), dobles grados, bachilleratos ni colleges.
// Cada carrera conserva su nombre oficial DEMRE; esto solo cambia cómo se agrupan.
// Listado de categorías: scripts/listarCategorias.mjs

export interface AliasCategoria {
  generica: string; // clave de la categoría a la que se une
  nombre: string; // nombre a mostrar de la categoría genérica
}

const ING_CIVIL: AliasCategoria = { generica: 'ingenieria-civil', nombre: 'Ingeniería Civil' };
const ING_CIVIL_INFORMATICA: AliasCategoria = { generica: 'ingenieria-civil-informatica', nombre: 'Ingeniería Civil Informática' };
const ING_COMERCIAL: AliasCategoria = { generica: 'ingenieria-comercial', nombre: 'Ingeniería Comercial' };

export const categoriasAlias: Record<string, AliasCategoria> = {
  // Ingeniería Civil (plan común)
  'ingenieria': ING_CIVIL,
  'ingenieria-civil-plan-comun': ING_CIVIL,
  'ingenieria-civil-plan-comun-curico': ING_CIVIL,
  'ingenieria-civil-plan-comun-talca': ING_CIVIL,
  'plan-comun-ingenieria-civil': ING_CIVIL,
  'ingenieria-y-ciencias': ING_CIVIL, // U. de Chile: "Ingeniería y Ciencias - Plan Común"

  // Ingeniería Civil Informática / Computación
  'ingenieria-civil-en-informatica': ING_CIVIL_INFORMATICA,
  'ingenieria-civil-en-computacion': ING_CIVIL_INFORMATICA,
  'ingenieria-civil-en-computacion-e-informatica': ING_CIVIL_INFORMATICA,

  // Ingeniería Comercial
  'ingenieria-comercial-con': ING_COMERCIAL,
  'ingenieria-comercial-licenciatura-en-ciencias-de-la-administracion': ING_COMERCIAL,

  // Ingeniería Civil en X = Ingeniería Civil X
  'ingenieria-civil-de-minas': { generica: 'ingenieria-civil-en-minas', nombre: 'Ingeniería Civil en Minas' },
  'ingenieria-civil-en-minas': { generica: 'ingenieria-civil-en-minas', nombre: 'Ingeniería Civil en Minas' },
  'ingenieria-civil-en-mecanica': { generica: 'ingenieria-civil-mecanica', nombre: 'Ingeniería Civil Mecánica' },
  'ingenieria-civil-en-quimica': { generica: 'ingenieria-civil-quimica', nombre: 'Ingeniería Civil Química' },
  'ingenieria-civil-en-telematica': { generica: 'ingenieria-civil-telematica', nombre: 'Ingeniería Civil Telemática' },
  'ingenieria-civil-en-informatica-y-telecomunicaciones': { generica: 'ingenieria-civil-informatica-y-telecomunicaciones', nombre: 'Ingeniería Civil Informática y Telecomunicaciones' },
  'ingenieria-civil-en-electricidad': { generica: 'ingenieria-civil-electrica', nombre: 'Ingeniería Civil Eléctrica' },
  'ingenieria-civil-en-metalurgia': { generica: 'ingenieria-civil-metalurgica', nombre: 'Ingeniería Civil Metalúrgica' },
  'ingenieria-civil-industrial-talca': { generica: 'ingenieria-civil-industrial', nombre: 'Ingeniería Civil Industrial' },

  // Ingeniería en X (ejecución): solo variantes de la misma carrera
  'ingenieria-de-alimentos': { generica: 'ingenieria-en-alimentos', nombre: 'Ingeniería en Alimentos' },
  'ingenieria-en-estadistica': { generica: 'ingenieria-estadistica', nombre: 'Ingeniería Estadística' },
  'ingenieria-informatica': { generica: 'ingenieria-en-informatica', nombre: 'Ingeniería en Informática' },
  'ingenieria-mecatronica': { generica: 'ingenieria-en-mecatronica', nombre: 'Ingeniería en Mecatrónica' },

  // "… con mención"
  'biologia-con': { generica: 'biologia', nombre: 'Biología' },
  'educacion-de-parvulos-con': { generica: 'educacion-de-parvulos', nombre: 'Educación de Párvulos' },
  'licenciatura-en-ciencias-con': { generica: 'licenciatura-en-ciencias', nombre: 'Licenciatura en Ciencias' },
  'lic-en-ciencias-con': { generica: 'licenciatura-en-ciencias', nombre: 'Licenciatura en Ciencias' },
  'tecnologia-medica-con': { generica: 'tecnologia-medica', nombre: 'Tecnología Médica' },
  'pedagogia-en-educacion-basica-con': { generica: 'pedagogia-en-educacion-basica', nombre: 'Pedagogía en Educación Básica' },
  'pedagogia-en-educacion-diferencial-con': { generica: 'pedagogia-en-educacion-diferencial', nombre: 'Pedagogía en Educación Diferencial' },
  'pedagogia-en-educacion-especial-con': { generica: 'pedagogia-en-educacion-especial', nombre: 'Pedagogía en Educación Especial' },
  'pedagogia-en-educacion-general-basica-con': { generica: 'pedagogia-en-educacion-general-basica', nombre: 'Pedagogía en Educación General Básica' },
  'pedagogia-en-educacion-parvularia-con': { generica: 'pedagogia-en-educacion-parvularia', nombre: 'Pedagogía en Educación Parvularia' },

  // Otras variantes de redacción
  'contador-publico-auditor': { generica: 'contador-publico-y-auditor', nombre: 'Contador Público y Auditor' },
  'pedagogia-matematica': { generica: 'pedagogia-en-matematica', nombre: 'Pedagogía en Matemática' },
  'pedagogia-en-ingles-para-ensenanza-basica-y-media': { generica: 'pedagogia-en-ingles-para-la-ensenanza-basica-y-media', nombre: 'Pedagogía en Inglés para la Enseñanza Básica y Media' },
};

// Categoría a la que pertenece una categoría DEMRE original.
export function categoriaGenerica(categoria: string): string {
  return categoriasAlias[categoria]?.generica ?? categoria;
}
