// pages/addressAdd/index.js
const app = getApp();
// var curl = 'https://miniapp.shopdz.cn/';
const curl = require('../../config').host;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    region: ['广东省', '广州市', '海珠区'],
    customItem: '全部',
    name:'',//姓名
    phone:'',//手机号
    address: null,//详情地址
    childAreaList: null,//所有省
    province: null,//所有市
    area:null,//所有县或地区
    province_id: null,//省份id
    info_province: null,//省份名字
    city_id: null,//城市id
    info_city: null,//城市名字
    area_id: null,//县或区id
    info_area: null,//县或区名字
    address_id:null,
    style:null,
    is_default:1,
    addressIs:true,
    _id:null
  },
  //省份
  bindChange:function(e){
    var self = this;
    var province_id = self.data.childAreaList[e.detail.value].area_id;//省份id
    var province = self.data.childAreaList[e.detail.value].area_name;//省份名字
    if (e.detail.value){
      self.province(province_id);
      self.setData({
        province_id: province_id,//省份id
        info_province: province,//省份名字
      })
    }
  },
  //市
  bindRegionChang:function(e){
    var self = this;
    var city_id = self.data.province[e.detail.value].area_id;//城市id
    var city = self.data.province[e.detail.value].area_name;//城市名字
    if (e.detail.value){
      self.area(city_id);
      this.setData({
        city_id: city_id,//城市id
        info_city: city,//城市名字
      })
    }
  },
  //区或县
  bindRegionChange: function (e) {
    var area = this.data.area[e.detail.value].area_name;
    if (e.detail.value){
      this.setData({
        area_id: this.data.area[e.detail.value].area_id,//县或区id
        info_area: area,//县或区名字
      })
    }
  },
  //姓名
  bindKeyName: function (e) {
    this.setData({
      name: e.detail.value
    })
  },
  //电话
  bindKeyMobile: function (e) {
    this.setData({
      phone: e.detail.value
    })
  },
  //详情地址
  bindKeyDetailed: function (e) {
    this.setData({
      address: e.detail.value
    })
  },
  //提交
  submitFun:function(){
    var self = this;

    var zn_zw = /^[\u4e00-\u9fa5]+$/;

    if (self.data.name.length > 10 || !self.data.name) {
      wx.showToast({
        title: "请输入正常姓名",
        icon: 'none',
        duration: 2000
      })
      return;
    }

    if (self.data.phone.length > 11 || self.data.phone.length < 11 || !self.data.phone) {
      wx.showToast({
        title: "请输入11位正常手机号",
        icon: 'none',
        duration: 2000
      })
      return;
    }
    var myreg = /^(((13[0-9]{1})|(15[0-9]{1})|(18[0-9]{1})|(17[0-9]{1}))+\d{8})$/;
    if (!myreg.test(self.data.phone)) {
      wx.showToast({
        title: "请输入11位正常手机号",
        icon: 'none',
        duration: 2000
      })
      return;
    }
    if (self.data.address.length > 50 || !self.data.address) {
      wx.showToast({
        title: "请缩减详情地址字数或请输入详情地址",
        icon: 'none',
        duration: 2000
      })
      return;
    }
    if (!self.data.info_province || !self.data.info_city || !self.data.info_area) {
      wx.showToast({
        title: "省份，城市，区县不能为空",
        icon: 'none',
        duration: 2000
      })
      return;
    }


    var key = wx.getStorageSync('key');
    var id = self.data.id;
    var num = self.data.num;
    var area_info = self.data.info_province + self.data.info_city + self.data.info_area;
    var params_wx = {
      key: key,
      true_name: self.data.name,
      province_id: self.data.province_id,
      city_id: self.data.city_id,
      area_id: self.data.area_id,
      area_info: area_info,
      address: self.data.address,
      tel_phone: self.data.phone,
      is_default: self.data.is_default,
    };
    wx.request({
      url: curl +'api.php/Member/addressAdd',
      data: params_wx,
      method:'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      success:function(res){
        console.log(res);
        if(num){
          wx.navigateTo({
            url: '../orderDetails/index?id=' + id +'&goods_num='+num,
          });
        }else{
          wx.navigateTo({
            url: '../orderDetails/index?id=' + id,
          });
        }
      }
    })
  },
  //默认选中
  defaults:function(e){
    var self = this;
    var is_default = e.currentTarget.dataset.id;
    if (is_default == 0){
      self.setData({
        is_default: '1',
      });
    } else if (is_default == 1){
      self.setData({
        is_default: '0',
      });
    }
  },
  //所有省份
  childAreaList:function(){
    var self = this;
    var key = wx.getStorageSync('key');
    wx.request({
      url: curl +'api.php/Member/getChildAreaList',
      data: { key: key, area_parent_id:0},
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      success:function(res){
        if(res.data.code == 0){
          var childAreaList = res.data.data; var i = 0;
          self.setData({
            childAreaList: childAreaList,
          });
        }
      }
    })
  },
  //所有市
  province: function (province){
    var self = this;
    var key = wx.getStorageSync('key');
    if (province){
      wx.request({
        url: curl +'api.php/Member/getChildAreaList',
        data: { key: key,area_parent_id: province},
        method: 'POST',
        header: {
          'content-type': 'application/x-www-form-urlencoded' // 默认值
        },
        success:function(res){
          if (res.data.code == 0) {
            var province = res.data.data;
            self.setData({
              province: province,
            });
          }
        }
      })
    }
  },
  //所有区或县
  area: function (area){
    var self = this;
    var key = wx.getStorageSync('key');
    if (area){
      wx.request({
        url: curl +'api.php/Member/getChildAreaList',
        data: { key: key, area_parent_id: area},
        method: 'POST',
        header: {
          'content-type': 'application/x-www-form-urlencoded' // 默认值
        },
        success:function(res){
          if (res.data.code == 0) {
            var area = res.data.data;
            self.setData({
              area: area,
            });
          }
        }
      })
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var self = this; 
    var id = options.id;
    var num = options.num;
    self.childAreaList();
    self.setData({
      id:id,
      num:num,
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})