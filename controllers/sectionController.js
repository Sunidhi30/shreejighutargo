const { validationResult, check } = require('express-validator');
const HomeSection = require('../models/HomeSection');
const Type = require('../models/Type');
const Category = require('../models/Category');
const Language = require('../models/Language');
const Channel = require('../models/Channel');

exports.index = async (req, res) => {
  try {
    const types = await Type.find({ status: 1 });
    const categories = await Category.find().sort({ createdAt: -1 });
    const languages = await Language.find().sort({ createdAt: -1 });
    const channels = await Channel.find().sort({ createdAt: -1 });

    res.status(200).json({
      type: types,
      category: categories,
      language: languages,
      channel: channels
    });
  } catch (err) {
    res.status(400).json({ status: 400, errors: err.message });
  }
};

exports.store = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 400, errors: errors.array().map(e => e.msg) });
    }

    let requestData = { ...req.body };
    requestData.short_title = requestData.short_title || '';
    requestData.sortable = 1;
    requestData.status = 1;

    if (requestData.is_home_screen == 1 && !requestData.video_type) {
      return res.status(400).json({ status: 400, errors: ['video_type is required for home screen sections.'] });
    }

    if (requestData.is_home_screen != 1) {
      if (requestData.top_type_type == 5) requestData.video_type = 6;
      else if (requestData.top_type_type == 6) requestData.video_type = 7;
      else if (requestData.top_type_type == 7) requestData.video_type = 9;
      else requestData.video_type = requestData.top_type_type;
    }

    if ([6, 7, 9].includes(Number(requestData.video_type)) && !requestData.sub_video_type) {
      return res.status(400).json({ status: 400, errors: ['sub_video_type is required.'] });
    }

    if ([1, 2, 6, 7, 9].includes(Number(requestData.video_type))) {
      if (requestData.is_home_screen == 1 && !requestData.type_id) {
        return res.status(400).json({ status: 400, errors: ['type_id is required for the selected video type.'] });
      }
    }

    if (requestData.is_home_screen == 2) {
      requestData.type_id = requestData.top_type_id;
    } else if (!requestData.type_id) {
      requestData.type_id = 0;
    }

    requestData.category_id = requestData.category_id || 0;
    requestData.language_id = requestData.language_id || 0;
    requestData.channel_id = requestData.channel_id || 0;
    requestData.order_by_upload = requestData.order_by_upload || 0;
    requestData.order_by_like = requestData.order_by_like || 0;
    requestData.order_by_view = requestData.order_by_view || 0;
    requestData.premium_video = requestData.premium_video || 0;
    requestData.rent_video = requestData.rent_video || 0;
    requestData.no_of_content = requestData.no_of_content || 1;
    requestData.view_all = requestData.view_all || 0;

    delete requestData.top_type_id;
    delete requestData.top_type_type;

    const filter = requestData.id ? { _id: requestData.id } : {};
    const section = await HomeSection.findOneAndUpdate(filter, requestData, {
      new: true,
      upsert: true,
    });

    if (section) {
      res.status(200).json({ status: 200, success: 'Section saved successfully.' });
    } else {
      res.status(400).json({ status: 400, errors: 'Section not saved.' });
    }

  } catch (err) {
    res.status(400).json({ status: 400, errors: err.message });
  }
};

exports.getSectionData = async (req, res) => {
  try {
    const { is_home_screen, top_type_id } = req.body;

    let data;
    if (Number(is_home_screen) === 1) {
      data = await HomeSection.find({ is_home_screen: 1 }).sort({ sortable: 1, createdAt: -1 });
    } else {
      data = await HomeSection.find({
        is_home_screen,
        type_id: top_type_id,
      }).sort({ sortable: 1, createdAt: -1 });
    }

    res.status(200).json({ status: 200, success: 'Data fetched successfully.', result: data });
  } catch (err) {
    res.status(400).json({ status: 400, errors: err.message });
  }
};

exports.sectionDataEdit = async (req, res) => {
  try {
    const { id } = req.body;
    const data = await HomeSection.findById(id);

    res.status(200).json({ status: 200, success: 'Data fetched successfully.', result: data });
  } catch (err) {
    res.status(400).json({ status: 400, errors: err.message });
  }
};
