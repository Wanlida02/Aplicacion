// netlify/functions/save-checklist.js
const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const data = JSON.parse(event.body || "{}");
    const { id_tarjeta, criticidad, notes } = data;

    if (!id_tarjeta) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "id_tarjeta es obligatorio" })
      };
    }

    // Buscar si ya existe un registro para esa tarjeta
    const filterFormula = encodeURIComponent(`{id_tarjeta} = "${id_tarjeta}"`);

    const findRes = await fetch(
      `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula=${filterFormula}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`
        }
      }
    );

    const findJson = await findRes.json();
    const existing = findJson.records && findJson.records[0];

    const fields = {
      id_tarjeta,
      criticidad: criticidad || "",
      notes: notes || ""
    };

    let url = `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
    let method = "POST";
    let body;

    if (existing) {
      // Actualizar registro existente
      url += `/${existing.id}`;
      method = "PATCH";
      body = JSON.stringify({ fields });
    } else {
      // Crear registro nuevo
      body = JSON.stringify({ fields });
    }

    const saveRes = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        "Content-Type": "application/json"
      },
      body
    });

    if (!saveRes.ok) {
      const txt = await saveRes.text();
      console.error("Airtable error:", txt);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Error guardando en Airtable" })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error interno" })
    };
  }
};