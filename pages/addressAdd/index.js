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
    name:'',
    phone:'',
    province:null,//省
    city: null,//市
    area:null,//县或地区
    info_province: null,//省
    info_city: null,//市
    info_area: null,//县或地区
    address:null,
    childAreaList:null,
    province_id:null,
    city_id:null,
    area_id:null,
    address_id:null,
    style:null,
    is_default:null,
    addressIs:true,
    _id:null
  },
  //省份
  bindChange:function(e){
    var self = this;
    var province_id = self.data.childAreaList[e.detail.value].area_id;
    var province = self.data.childAreaList[e.detail.value].area_name;
    if (e.detail.value){
      self.province(province_id);
      self.setData({
        province_id: province_id,
        info_province: province,
        city_id:false,
        area_id: false,
      })
    }
  },
  //市
  bindRegionChang:function(e){
    var self = this;
    var city_id = self.data.province[e.detail.value].area_id;
    var city = self.data.province[e.detail.value].area_name;
    if (e.detail.value){
      self.area(city_id);
      console.log(city);
      this.setData({
        city_id: city_id,
        info_city: city,
        area_id:false,
      })
    }
  },
  //区或县
  bindRegionChange: function (e) {
    var area = this.data.area[e.detail.value].area_name;
    if (e.detail.value){
      this.setData({
        area_id: this.data.area[e.detail.value].area_id,
        info_area: area,
      })
    }
  },
  bindKeyName: function (e) {
    this.setData({
      name: e.detail.value
    })
  },
  bindKeyMobile: function (e) {
    this.setData({
      phone: e.detail.value
    })
  },
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
      address_id: self.data.address_id,
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
        wx.navigateBack();
      }
    })
  },
  //默认选中
  defaults:function(e){
    var self = this;
    var is_default = e.currentTarget.dataset.id;
    if (is_default == 0){
      self.setData({
        style: 'check-box',
        is_default: '1',
      });
    } else if (is_default == 1){
      self.setData({
        style: 'checks-box',
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
          for(var i = 0; i < childAreaList.length;i++){
            if (self.data.province_id == childAreaList[i].area_id){
              var info_province = childAreaList[i].area_name;
            }
          }
          self.setData({
            childAreaList: childAreaList,
            info_province: info_province,
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
            for (var i = 0; i < province.length; i++) {
              if (self.data.city_id == province[i].area_id) {
                var info_city = province[i].area_name;
                break;
              }else{
                var info_area = null;
              }
            }
            self.setData({
              province: province,
              info_city: info_city,
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
            for (var i = 0; i < area.length; i++) {
              if (self.data.area_id == area[i].area_id) {
                var info_area = area[i].area_name;
                break;
              }else{
                var info_area = null;
              }
            }
            self.setData({
              area: area,
              info_area: info_area,
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
    if (options.address_id){
      var province_id = options.province;
      var city_id = options.city;
      var area_id = options.area;
      var is_default = options.is_default;
      if (is_default == 1){
        var style = 'check-box';
      }else if(is_default== 0){
        var style = 'checks-box';
      }
      self.childAreaList();
      self.province(province_id);
      self.area(city_id);
      this.setData({
          style: style,
          is_default: is_default,
          city_id: city_id,
          province_id: province_id,
          area_id: area_id,
          address: options.address,
          name: options.name,
          phone: options.phone,
          // detailed: options.detailed,
          address_id: options.address_id,
          addressIs:false
      })
    }
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