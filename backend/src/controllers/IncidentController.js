const connection = require("../database/connection");

module.exports = {
  async index(req, res) {
    const { page = 1 } = req.query;

    const [count] = await connection("incidents").count();
    console.log(count);
    const incidents = await connection("incidents")
      .join("ongs", "ongs.id", "=", "incidents.ong_id")
      .limit(5)
      .offset(5 * (page - 1))
      .select([
        "incidents.*",
        "ongs.name",
        "ongs.email",
        "ongs.whatsapp",
        "ongs.city",
        "ongs.uf"
      ]);

    res.header("X-Total-Count", count["count(*)"]);

    return res.json(incidents);
  },

  async create(req, res) {
    const { title, description, value } = req.body;
    const ong_id = req.headers.authorization;

    if (!ong_id)
      return res.status(400).json({ error: "ONG Field is required" });

    const ongExists = await connection("ongs")
      .where("id", ong_id)
      .select("*")
      .first();

    if (!ongExists)
      return res.status(400).json({ error: "ONG does not exists" });

    const [id] = await connection("incidents").insert({
      title,
      description,
      value,
      ong_id
    });

    return res.json({ id });
  },

  async delete(req, res) {
    const { id } = req.params;
    const ong_id = req.headers.authorization;

    const incident = await connection("incidents")
      .where("id", id)
      .select("ong_id")
      .first();

    if (incident.ong_id !== ong_id) {
      console.log(incident.ong_id, ong_id);
      return res
        .status(401)
        .json({ error: "You are not allowed delete this incident" });
    }

    await connection("incidents")
      .where("id", id)
      .delete();

    return res.send(204).send();
  }
};
