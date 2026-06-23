// functions/save-checklist.js
const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    if (!AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME || !AIRTABLE_TOKEN) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Faltan variables de entorno de Airtable" })
      };
    }

    const data = JSON.parse(event.body || "{}");
    const { id_tarjeta, criticidad, notes, notas } = data;

    if (!id_tarjeta) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "id_tarjeta es obligatorio" })
      };
    }

    const notesValue = notes ?? notas ?? "";

    const filterFormula = encodeURIComponent(`{id_tarjeta}="${id_tarjeta}"`);

    const findRes = await fetch(
      `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula=${filterFormula}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!findRes.ok) {
      const txt = await findRes.text();
      console.error("Airtable find error:", txt);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Error buscando en Airtable", detail: txt })
      };
    }

    const findJson = await findRes.json();
    const existing = findJson.records && findJson.records[0];

    const fields = {
      id_tarjeta,
      criticidad: criticidad || "",
      notes: notesValue
    };

    let url = `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
    let method = "POST";
    let body = JSON.stringify({ fields });

    if (existing) {
      url = `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${existing.id}`;
      method = "PATCH";
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
      console.error("Airtable save error:", txt);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Error guardando en Airtable", detail: txt })
      };
    }

    const saveJson = await saveRes.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        recordId: saveJson.id || null
      })
    };
  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Error interno",
        detail: err.message || String(err)
      })
    };
  }
};